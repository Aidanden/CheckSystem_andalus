const express = require('express');
const xml2js = require('xml2js');

const DEFAULT_PORT = 8080;
const DEFAULT_HOST = '10.250.100.40';

function generateMsgId() {
  return Math.floor(Math.random() * 9000000000000000) + 1000000000000000;
}

function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getChequeLeavesByAccountType(accountType) {
  switch (accountType) {
    case 1:
      return 25;
    case 2:
      return 50;
    case 3:
      return 10;
    default:
      return 25;
  }
}

function generateChequeStatuses(firstChequeNumber, numberOfLeaves) {
  const statuses = [];
  const firstNum = parseInt(firstChequeNumber, 10);

  for (let i = 0; i < numberOfLeaves; i++) {
    const chequeNum = firstNum + i;
    statuses.push({
      CHQ_BOOK_NO: firstChequeNumber,
      CHQ_NO: chequeNum.toString(),
      STATUS: 'N',
    });
  }

  return statuses;
}

function createSoapTestServer({ accounts, messages, port = DEFAULT_PORT, host = DEFAULT_HOST }) {
  const app = express();

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, SOAPAction');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use((req, res, next) => {
    if ((req.path === '/FCUBSAccService' || req.path === '/FCUBSIAService') && req.method === 'POST') {
      let data = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        req.body = data;
        next();
      });
    } else {
      express.json()(req, res, next);
    }
  });

  const soapHandler = async (req, res) => {
    try {
      console.log(messages.logReceived(req.path));

      if (!req.body || typeof req.body !== 'string' || req.body.trim().length === 0) {
        throw new Error(messages.invalidXml);
      }

      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        tagNameProcessors: [xml2js.processors.stripPrefix],
      });

      const result = await parser.parseStringPromise(req.body);
      console.log('📊 XML Structure:', JSON.stringify(result, null, 2).substring(0, 500));

      let operation = '';
      let accountBranch = '';
      let account = '';

      if (result.Envelope && result.Envelope.Body) {
        if (result.Envelope.Body.QUERYCHECKBOOK_IOFS_REQ) {
          operation = 'QueryCheckBook';
          const requestBody = result.Envelope.Body.QUERYCHECKBOOK_IOFS_REQ;
          accountBranch = requestBody.FCUBS_BODY['Chq-Bk-Details-IO'].ACCOUNT_BRANCH;
          account = requestBody.FCUBS_BODY['Chq-Bk-Details-IO'].ACCOUNT;
        } else if (result.Envelope.Body.QUERYIACUSTACC_IOFS_REQ) {
          operation = 'QueryCustomerName';
          const requestBody = result.Envelope.Body.QUERYIACUSTACC_IOFS_REQ;
          accountBranch = requestBody.FCUBS_BODY['Cust-Account-IO'].BRN;
          account = requestBody.FCUBS_BODY['Cust-Account-IO'].ACC;
        }
      }

      if (!operation && (result.ACCOUNT_BRANCH || result.ACCOUNT || result.ACC)) {
        accountBranch = result.ACCOUNT_BRANCH || result.BRN || '001';
        account = result.ACCOUNT || result.ACC;
        operation = result.OPERATION || 'QueryCheckBook';
      }

      console.log(messages.logOperation, operation);
      console.log(messages.logBranch, accountBranch);
      console.log(messages.logAccount, account);

      const accountData = accounts.find((acc) => acc.account === account);

      if (!accountData) {
        throw new Error(messages.accountNotFound(account));
      }

      console.log(messages.logAccountData, {
        account: accountData.account,
        name: accountData.name,
        accountType: accountData.accountType,
        startCheck: accountData.startCheck,
      });

      let responseXml = '';

      if (operation === 'QueryCheckBook') {
        const firstChequeNumber = accountData.startCheck;
        const accountType = accountData.accountType || 1;
        const chequeLeaves = getChequeLeavesByAccountType(accountType);
        const chequeStatuses = generateChequeStatuses(firstChequeNumber, chequeLeaves);

        console.log(messages.accountTypeLabel(accountType, chequeLeaves));
        console.log(messages.logChequesGenerated(chequeStatuses.length));

        responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
   <S:Body>
      <QUERYCHECKBOOK_IOFS_RES xmlns="http://fcubs.ofss.com/service/FCUBSAccService">
         <FCUBS_HEADER>
            <SOURCE>FCAT</SOURCE>
            <UBSCOMP>FCUBS</UBSCOMP>
            <MSGID>${generateMsgId()}</MSGID>
            <CORRELID>null</CORRELID>
            <USERID>ADMINUSER1</USERID>
            <ENTITY>null</ENTITY>
            <BRANCH>${accountBranch}</BRANCH>
            <MODULEID>CA</MODULEID>
            <SERVICE>FCUBSAccService</SERVICE>
            <OPERATION>QueryCheckBook</OPERATION>
            <DESTINATION>FCAT</DESTINATION>
            <FUNCTIONID>CADCHBOO</FUNCTIONID>
            <ACTION>EXECUTEQUERY</ACTION>
            <MSGSTAT>SUCCESS</MSGSTAT>
         </FCUBS_HEADER>
         <FCUBS_BODY>
            <Chq-Bk-Details-Full>
               <INCL_FOR_CHKBOOK_PRINTING>Y</INCL_FOR_CHKBOOK_PRINTING>
               <ACCOUNT_BRANCH>${accountBranch}</ACCOUNT_BRANCH>
               <ACCOUNT>${account}</ACCOUNT>
               <FIRST_CHEQUE_NUMBER>${firstChequeNumber}</FIRST_CHEQUE_NUMBER>
               <CHEQUE_LEAVES>${chequeLeaves}</CHEQUE_LEAVES>
               <ORDER_DATE>${getCurrentDate()}</ORDER_DATE>
               <ISSUE_DATE>${getCurrentDate()}</ISSUE_DATE>
               <CHQ_TYPE>COMM</CHQ_TYPE>
               <CH_BK_TYPE>ACB</CH_BK_TYPE>
               <DELIVERY_MODE>B</DELIVERY_MODE>
               <LANGCODE>${messages.langCode}</LANGCODE>
               <REQUEST_STATUS>Delivered</REQUEST_STATUS>
               <REQUEST_MODE>FLEXCUBE</REQUEST_MODE>
               <APPLY_CHG>Y</APPLY_CHG>
               <ISSBRN>${accountBranch}</ISSBRN>
               <MAKER>ZAHIDJAVED1</MAKER>
               <MAKERSTAMP>${getCurrentTimestamp()}</MAKERSTAMP>
               <CHECKER>ZAHIDJAVED1</CHECKER>
               <CHECKERSTAMP>${getCurrentTimestamp()}</CHECKERSTAMP>
               <MODNO>2</MODNO>
               <TXNSTAT>O</TXNSTAT>
               <AUTHSTAT>A</AUTHSTAT>
               ${chequeStatuses
                 .map(
                   (status) => `<Cavws-Cheque-Status>
                  <CHQ_BOOK_NO>${status.CHQ_BOOK_NO}</CHQ_BOOK_NO>
                  <CHQ_NO>${status.CHQ_NO}</CHQ_NO>
                  <STATUS>${status.STATUS}</STATUS>
               </Cavws-Cheque-Status>`
                 )
                 .join('\n               ')}
               <UDFDETAILS>
                  <FLDNAM>CHECK_BOOK</FLDNAM>
                  <FLDVAL>0012256686885+</FLDVAL>
               </UDFDETAILS>
            </Chq-Bk-Details-Full>
            <FCUBS_WARNING_RESP>
               <WARNING>
                  <WCODE>ST-SAVE-023</WCODE>
                  <WDESC>Record Successfully Retrieved</WDESC>
               </WARNING>
            </FCUBS_WARNING_RESP>
         </FCUBS_BODY>
      </QUERYCHECKBOOK_IOFS_RES>
   </S:Body>
</S:Envelope>`;
      } else if (operation === 'QueryCustomerName') {
        responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
   <S:Body>
      <QUERYIACUSTACC_IOFS_RES xmlns="http://fcubs.ofss.com/service/FCUBSIAService">
         <FCUBS_HEADER>
            <SOURCE>FCAT</SOURCE>
            <UBSCOMP>FCUBS</UBSCOMP>
            <MSGID>${generateMsgId()}</MSGID>
            <CORRELID>null</CORRELID>
            <USERID>ADMINUSER1</USERID>
            <ENTITY>null</ENTITY>
            <BRANCH>${accountBranch}</BRANCH>
            <MODULEID>ST</MODULEID>
            <SERVICE>FCUBSIAService</SERVICE>
            <OPERATION>QueryIACustAcc</OPERATION>
            <DESTINATION>FCAT</DESTINATION>
            <FUNCTIONID>STDCUS</FUNCTIONID>
            <ACTION>EXECUTEQUERY</ACTION>
            <MSGSTAT>SUCCESS</MSGSTAT>
         </FCUBS_HEADER>
         <FCUBS_BODY>
            <Cust-Account-Full>
               <BRN>${accountBranch}</BRN>
               <ACC>${account}</ACC>
               <CUSTNAME>${accountData.name}</CUSTNAME>
               <ADESC>${accountData.name}</ADESC>
               <CUSTNO>123456</CUSTNO>
               <ACCCLS>CURRENT</ACCCLS>
               <CCY>LYD</CCY>
            </Cust-Account-Full>
            <FCUBS_WARNING_RESP>
               <WARNING>
                  <WCODE>ST-SAVE-023</WCODE>
                  <WDESC>Record Successfully Retrieved</WDESC>
               </WARNING>
            </FCUBS_WARNING_RESP>
         </FCUBS_BODY>
      </QUERYIACUSTACC_IOFS_RES>
   </S:Body>
</S:Envelope>`;
      } else {
        throw new Error(messages.unsupportedOperation(operation));
      }

      console.log(messages.logSuccess);

      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.send(responseXml);
    } catch (error) {
      console.error(messages.logError, error.message);

      const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
   <S:Body>
      <S:Fault>
         <faultcode>S:Server</faultcode>
         <faultstring>Internal Server Error</faultstring>
         <detail>
            <message>${error.message}</message>
         </detail>
      </S:Fault>
   </S:Body>
</S:Envelope>`;

      res.status(500).set('Content-Type', 'text/xml; charset=utf-8');
      res.send(errorResponse);
    }
  };

  app.post('/FCUBSAccService', soapHandler);
  app.post('/FCUBSIAService', soapHandler);

  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      service: 'FCUBS SOAP Test Server',
      locale: messages.langCode === 'ENG' ? 'en' : 'ar',
      timestamp: new Date().toISOString(),
      accounts_count: accounts.length,
    });
  });

  function start() {
    app.listen(port, () => {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(messages.bannerTitle(port));
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(messages.checkBookEndpoint(host, port));
      console.log(messages.customerEndpoint(host, port));
      console.log(messages.health(host, port));
      console.log(messages.supportedOpsTitle);
      console.log(messages.opCheckBook);
      console.log(messages.opCustomer);
      console.log(messages.accountsTitle);
      accounts.forEach((acc) => {
        console.log(messages.accountLine(acc));
      });
      console.log('═══════════════════════════════════════════════════════════════\n');
    });
  }

  return { app, start };
}

module.exports = { createSoapTestServer, DEFAULT_PORT, DEFAULT_HOST };
