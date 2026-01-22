import { request } from '../client';

export interface PrintLogData {
  accountNumber: string;
  accountBranch: string;
  branchName?: string;
  firstChequeNumber: number;
  lastChequeNumber: number;
  totalCheques: number;
  accountType: number;
  operationType: 'print' | 'reprint';
  reprintReason?: 'damaged' | 'not_printed'; // سبب إعادة الطباعة: 'damaged' = تالفة، 'not_printed' = لم تطبع
  notes?: string;
  chequeNumbers: number[];
}

export interface PrintLog {
  id: number;
  accountNumber: string;
  accountBranch: string;
  branchName?: string;
  firstChequeNumber: number;
  lastChequeNumber: number;
  totalCheques: number;
  accountType: number;
  operationType: string;
  printedBy: number;
  printedByName: string;
  printDate: string;
  notes?: string;
}

export interface ChequeStatus {
  chequeNumber: number;
  isPrinted: boolean;
  canReprint: boolean;
}

export const printLogService = {
  // إنشاء سجل طباعة
  create: async (data: PrintLogData): Promise<PrintLog> => {
    return request<PrintLog>({
      url: '/print-logs',
      method: 'POST',
      data,
    });
  },

  // التحقق من حالة طباعة الشيكات
  checkStatus: async (
    accountNumber: string,
    chequeNumbers: number[]
  ): Promise<ChequeStatus[]> => {
    return request<ChequeStatus[]>({
      url: '/print-logs/check-status',
      method: 'POST',
      data: { accountNumber, chequeNumbers },
    });
  },

  // جلب جميع السجلات
  getAll: async (params?: {
    page?: number;
    limit?: number;
    operationType?: 'print' | 'reprint';
    accountNumber?: string;
    startDate?: string;
    endDate?: string;
    userId?: number;
  }): Promise<{ logs: PrintLog[]; total: number }> => {
    return request<{ logs: PrintLog[]; total: number }>({
      url: '/print-logs',
      method: 'GET',
      params,
    });
  },

  // جلب سجل واحد
  getById: async (id: number): Promise<PrintLog> => {
    return request<PrintLog>({
      url: `/print-logs/${id}`,
      method: 'GET',
    });
  },

  // السماح بإعادة الطباعة
  allowReprint: async (accountNumber: string, chequeNumbers: number[]): Promise<void> => {
    return request<void>({
      url: '/print-logs/allow-reprint',
      method: 'POST',
      data: { accountNumber, chequeNumbers },
    });
  },
};
