async function testSoapConnection() {
    const soapUrl = 'http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService';
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fcub="http://fcubs.ofss.com/service/FCUBSAccService">
  <soapenv:Header/>
  <soapenv:Body>
    <fcub:QUERYCHECKBOOK_IOFS_REQ>
      <fcub:FCUBS_HEADER>
        <fcub:SOURCE>FCAT</fcub:SOURCE>
        <fcub:UBSCOMP>FCUBS</fcub:UBSCOMP>
        <fcub:USERID>ADMINUSER1</fcub:USERID>
        <fcub:BRANCH>001</fcub:BRANCH>
        <fcub:SERVICE>FCUBSAccService</fcub:SERVICE>
        <fcub:OPERATION>QueryCheckBook</fcub:OPERATION>
      </fcub:FCUBS_HEADER>
      <fcub:FCUBS_BODY>
        <fcub:Chq-Bk-Details-IO>
          <fcub:ACCOUNT_BRANCH>001</fcub:ACCOUNT_BRANCH>
          <fcub:ACCOUNT>001001000811217</fcub:ACCOUNT>
          <fcub:FIRST_CHEQUE_NUMBER>734</fcub:FIRST_CHEQUE_NUMBER>
        </fcub:Chq-Bk-Details-IO>
      </fcub:FCUBS_BODY>
    </fcub:QUERYCHECKBOOK_IOFS_REQ>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
        console.log('Testing SOAP connection to:', soapUrl);
        const response = await fetch(soapUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml'
            },
            body: xmlBody
        });

        console.log('Status:', response.status);

        if (response.ok) {
            const text = await response.text();
            console.log('✅ Connection Successful!');
            console.log('Data Preview:', text.substring(0, 200));
        } else {
            console.error('❌ Connection Failed!');
            const text = await response.text();
            console.error('Data:', text);
        }
    } catch (error) {
        console.error('❌ Connection Error:', error.message);
    }
}

testSoapConnection();
