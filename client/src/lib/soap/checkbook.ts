const SOAP_ENDPOINT = process.env.NEXT_PUBLIC_SOAP_ENDPOINT || 'http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService';

const DEFAULT_BRANCH = '001';

const padNumber = (value: number, length = 9) => value.toString().padStart(length, '0');

const buildMicrLine = (serial: string, accountNumber: string, routingNumber: string, accountType: 1 | 2) => {
  const typeCode = accountType === 1 ? '01' : '02';
  // Ensure routing number is full length (8 digits) if possible, otherwise use what is provided
  // User requested full routing number. If it's short (e.g. 001), it might be wrong, but we print what we have.
  // The backend should provide the full routing number.
  const routing = routingNumber;

  // Format: Serial(Left)  Routing(Center)  Account Type(Right)
  // User request: Start from right: Type -> Account -> Routing -> Serial
  // This corresponds to standard MICR LTR layout: [Serial] [Routing] [Account] [Type]
  return `C${serial}C A${routingNumber}A ${accountNumber}C ${typeCode}`;
};

const getTextContent = (root: ParentNode | null, tagName: string): string => {
  if (!root) return '';
  const asElement = root instanceof Document ? root : (root as Element);
  const direct = asElement.getElementsByTagName(tagName);
  if (direct.length > 0) {
    return (direct[0].textContent || '').trim();
  }
  const ns = (asElement as Element).getElementsByTagNameNS?.('*', tagName);
  if (ns && ns.length > 0) {
    return (ns[0].textContent || '').trim();
  }
  return '';
};

export interface SoapChequeStatus {
  chequeBookNumber: string;
  chequeNumber: number;
  status: string;
}

export interface SoapCheckbookResponse {
  accountNumber: string;
  accountBranch: string;
  branchName?: string;
  routingNumber?: string;
  customerName?: string;
  firstChequeNumber?: number;
  chequeLeaves?: number;
  requestStatus?: string;
  checkBookType?: string;
  deliveryMode?: string;
  languageCode?: string;
  maker?: string;
  makerStamp?: string;
  checker?: string;
  checkerStamp?: string;
  chequeStatuses: SoapChequeStatus[];
  rawXml: string;
}

interface QueryParams {
  accountNumber: string;
  branchCode?: string;
  firstChequeNumber?: number;
}

const buildSoapEnvelope = ({ accountNumber, branchCode, firstChequeNumber }: Required<QueryParams>): string => {
  const firstChequeFragment = firstChequeNumber
    ? `<FIRST_CHEQUE_NUMBER>${firstChequeNumber}</FIRST_CHEQUE_NUMBER>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <QUERYCHECKBOOK_IOFS_REQ xmlns="http://fcubs.ofss.com/service/FCUBSAccService">
      <FCUBS_HEADER>
        <SOURCE>FCAT</SOURCE>
        <UBSCOMP>FCUBS</UBSCOMP>
        <MSGID>${Date.now()}</MSGID>
        <CORRELID>null</CORRELID>
        <USERID>ADMINUSER1</USERID>
        <ENTITY>null</ENTITY>
        <BRANCH>${branchCode}</BRANCH>
        <MODULEID>CA</MODULEID>
        <SERVICE>FCUBSAccService</SERVICE>
        <OPERATION>QueryCheckBook</OPERATION>
        <DESTINATION>FCAT</DESTINATION>
        <FUNCTIONID>CADCHBOO</FUNCTIONID>
        <ACTION>EXECUTEQUERY</ACTION>
      </FCUBS_HEADER>
      <FCUBS_BODY>
        <Chq-Bk-Details-IO>
          <ACCOUNT_BRANCH>${branchCode}</ACCOUNT_BRANCH>
          <ACCOUNT>${accountNumber}</ACCOUNT>
          ${firstChequeFragment}
        </Chq-Bk-Details-IO>
      </FCUBS_BODY>
    </QUERYCHECKBOOK_IOFS_REQ>
  </S:Body>
</S:Envelope>`;
};

const parseStatuses = (detailsNode: Element | null): SoapChequeStatus[] => {
  if (!detailsNode) return [];
  const nodes = Array.from(detailsNode.getElementsByTagName('Cavws-Cheque-Status'));
  return nodes.map((node) => ({
    chequeBookNumber: getTextContent(node, 'CHQ_BOOK_NO'),
    chequeNumber: parseInt(getTextContent(node, 'CHQ_NO') || '0', 10),
    status: getTextContent(node, 'STATUS') || 'N',
  })).filter((item) => item.chequeNumber > 0);
};

export async function querySoapCheckbook(
  params: QueryParams,
  options?: { endpoint?: string }
): Promise<SoapCheckbookResponse> {
  const prepared: Required<QueryParams> = {
    accountNumber: params.accountNumber.trim(),
    branchCode: (params.branchCode || DEFAULT_BRANCH).trim() || DEFAULT_BRANCH,
    firstChequeNumber: params.firstChequeNumber || 0,
  };

  const envelope = buildSoapEnvelope(prepared);
  const targetEndpoint = options?.endpoint?.trim() || SOAP_ENDPOINT;

  const response = await fetch(targetEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
    },
    body: envelope,
  });

  const rawXml = await response.text();

  if (!response.ok) {
    throw new Error(`SOAP Error ${response.status}: ${rawXml.slice(0, 200)}`);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawXml, 'text/xml');
  const fault = doc.getElementsByTagName('Fault')[0];
  if (fault) {
    const faultString = getTextContent(fault, 'faultstring') || 'Unknown SOAP Fault';
    const detail = getTextContent(fault, 'detail');
    throw new Error(`SOAP Fault: ${faultString}${detail ? ` - ${detail}` : ''}`);
  }

  const detailsNode = doc.getElementsByTagName('Chq-Bk-Details-Full')[0] as Element | undefined;
  if (!detailsNode) {
    throw new Error('لم يتم العثور على تفاصيل دفتر الشيكات في استجابة SOAP');
  }

  const chequeStatuses = parseStatuses(detailsNode);

  return {
    accountNumber: getTextContent(detailsNode, 'ACCOUNT') || prepared.accountNumber,
    accountBranch: getTextContent(detailsNode, 'ACCOUNT_BRANCH') || prepared.branchCode,
    firstChequeNumber: parseInt(getTextContent(detailsNode, 'FIRST_CHEQUE_NUMBER') || '0', 10) || undefined,
    chequeLeaves: parseInt(getTextContent(detailsNode, 'CHEQUE_LEAVES') || '0', 10) || undefined,
    requestStatus: getTextContent(detailsNode, 'REQUEST_STATUS'),
    checkBookType: getTextContent(detailsNode, 'CH_BK_TYPE'),
    deliveryMode: getTextContent(detailsNode, 'DELIVERY_MODE'),
    languageCode: getTextContent(detailsNode, 'LANGCODE'),
    maker: getTextContent(detailsNode, 'MAKER'),
    makerStamp: getTextContent(detailsNode, 'MAKERSTAMP'),
    checker: getTextContent(detailsNode, 'CHECKER'),
    checkerStamp: getTextContent(detailsNode, 'CHECKERSTAMP'),
    chequeStatuses,
    rawXml,
  };
}

import type { CheckbookData } from '@/lib/utils/printRenderer';
import type { PrintSettings } from '@/lib/printSettings.api';

const DEFAULT_LAYOUT = {
  checkWidth: 235,
  checkHeight: 86,
  branchName: { x: 20, y: 10, fontSize: 14, align: 'left' as const },
  accountNumber: { x: 117.5, y: 10, fontSize: 14, align: 'center' as const },
  serialNumber: { x: 200, y: 18, fontSize: 12, align: 'right' as const },
  checkSequence: { x: 20, y: 18, fontSize: 12, align: 'left' as const },
  accountHolderName: { x: 20, y: 70, fontSize: 10, align: 'left' as const },
  micrLine: { x: 117.5, y: 80, fontSize: 12, align: 'center' as const },
};

interface PreviewOptions {
  layout?: PrintSettings;
  branchName?: string;
  routingNumber?: string;
  accountHolderName?: string;
}

export function buildPreviewFromSoap(
  data: SoapCheckbookResponse,
  options: PreviewOptions = {}
): CheckbookData {
  // تصفية الشيكات الفارغة أو غير الصالحة قبل الفرز
  const validStatuses = data.chequeStatuses.filter(
    status => status && status.chequeNumber && status.chequeNumber > 0
  );
  const sortedStatuses = [...validStatuses].sort((a, b) => a.chequeNumber - b.chequeNumber);
  
  // تحديد نوع الحساب بناءً على عدد الأوراق (chequeLeaves)
  // 10 = Employee (3), 25 = Individual (1), 50 = Corporate (2)
  let accountType: 1 | 2 | 3;
  if (data.chequeLeaves === 10) {
    accountType = 3; // Employee
  } else if (data.chequeLeaves === 25) {
    accountType = 1; // Individual
  } else if (data.chequeLeaves === 50) {
    accountType = 2; // Corporate
  } else {
    // Fallback: استخدام رقم الحساب إذا لم يكن chequeLeaves متوفراً
    accountType = data.accountNumber.startsWith('2') ? 2 : 1;
  }
  
  const accountHolderName = options.accountHolderName || data.customerName || 'صاحب الحساب';

  const layout = options.layout;
  const positions = {
    branchName: layout?.branchName ?? DEFAULT_LAYOUT.branchName,
    accountNumber: layout?.accountNumber ?? DEFAULT_LAYOUT.accountNumber,
    serialNumber: layout?.serialNumber ?? DEFAULT_LAYOUT.serialNumber,
    checkSequence: layout?.checkSequence ?? DEFAULT_LAYOUT.checkSequence,
    accountHolderName: layout?.accountHolderName ?? DEFAULT_LAYOUT.accountHolderName,
    micrLine: layout?.micrLine ?? DEFAULT_LAYOUT.micrLine,
  } as const;

  const checkWidth = layout?.checkWidth ?? DEFAULT_LAYOUT.checkWidth;
  const checkHeight = layout?.checkHeight ?? DEFAULT_LAYOUT.checkHeight;

  const branchLabel = options.branchName ?? `فرع ${data.accountBranch}`;
  const routingNumber = options.routingNumber ?? data.accountBranch;

  // إنشاء الشيكات فقط للشيكات الصالحة
  const checks = sortedStatuses
    .filter(status => status && status.chequeNumber && status.chequeNumber > 0)
    .map((status, index) => {
      const serialNumber = padNumber(status.chequeNumber);
      return {
        checkNumber: index + 1,
        serialNumber,
        accountHolderName,
        accountNumber: data.accountNumber,
        accountType: accountType === 1 ? '01' : accountType === 2 ? '02' : '01',
        branchName: branchLabel,
        routingNumber,
        checkSize: { width: checkWidth, height: checkHeight, unit: 'mm' },
        micrLine: buildMicrLine(serialNumber, data.accountNumber, routingNumber, accountType),
        branchNameX: positions.branchName.x,
        branchNameY: positions.branchName.y,
        branchNameFontSize: positions.branchName.fontSize,
        branchNameAlign: positions.branchName.align,
        accountNumberX: positions.accountNumber.x,
        accountNumberY: positions.accountNumber.y,
        accountNumberFontSize: positions.accountNumber.fontSize,
        accountNumberAlign: positions.accountNumber.align,
        serialNumberX: positions.serialNumber.x,
        serialNumberY: positions.serialNumber.y,
        serialNumberFontSize: positions.serialNumber.fontSize,
        serialNumberAlign: positions.serialNumber.align,
        checkSequenceX: positions.checkSequence.x,
        checkSequenceY: positions.checkSequence.y,
        checkSequenceFontSize: positions.checkSequence.fontSize,
        checkSequenceAlign: positions.checkSequence.align,
        accountHolderNameX: positions.accountHolderName.x,
        accountHolderNameY: positions.accountHolderName.y,
        accountHolderNameFontSize: positions.accountHolderName.fontSize,
        accountHolderNameAlign: positions.accountHolderName.align,
        micrLineX: positions.micrLine.x,
        micrLineY: positions.micrLine.y,
        micrLineFontSize: positions.micrLine.fontSize,
        micrLineAlign: positions.micrLine.align,
      };
    });

  const serialFrom = sortedStatuses[0]?.chequeNumber || data.firstChequeNumber || 0;
  const serialTo = sortedStatuses[sortedStatuses.length - 1]?.chequeNumber || serialFrom;

  return {
    operation: {
      accountNumber: data.accountNumber,
      accountHolderName,
      accountType,
      branchName: branchLabel,
      routingNumber,
      serialFrom,
      serialTo,
      sheetsPrinted: sortedStatuses.length,
      printDate: new Date(),
    },
    checks,
  };
}
