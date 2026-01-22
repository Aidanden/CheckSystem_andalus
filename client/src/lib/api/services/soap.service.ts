import { request } from '../client';

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
  rawXml?: string;
}

interface QueryCheckbookParams {
  accountNumber: string;
  branchCode?: string;
  firstChequeNumber?: number;
}

export const soapService = {
  queryCheckbook: async (params: QueryCheckbookParams): Promise<SoapCheckbookResponse> => {
    return request<SoapCheckbookResponse>({
      url: '/soap/query-checkbook',
      method: 'POST',
      data: params,
    });
  },
};
