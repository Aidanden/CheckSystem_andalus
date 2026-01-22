import { request } from '../client';
import { PrintCheckbookRequest, PrintCheckbookResponse, PrintOperation, PrintStatistics } from '@/types';

export const printingService = {
  // Print checkbook
  printCheckbook: async (data: PrintCheckbookRequest): Promise<PrintCheckbookResponse> => {
    return request<PrintCheckbookResponse>({
      url: '/printing/print',
      method: 'POST',
      data,
    });
  },

  // Get print history
  getHistory: async (filters?: {
    branchId?: number;
    userId?: number;
    accountNumber?: string;
    accountHolderName?: string;
    accountType?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<PrintOperation[]> => {
    const params: any = {};

    if (filters?.branchId !== undefined) params.branch_id = filters.branchId;
    if (filters?.userId !== undefined) params.user_id = filters.userId;
    if (filters?.accountNumber) params.account_number = filters.accountNumber;
    if (filters?.accountHolderName) params.account_holder_name = filters.accountHolderName;
    if (filters?.accountType !== undefined) params.account_type = filters.accountType;
    if (filters?.status) params.status = filters.status;
    if (filters?.dateFrom) params.date_from = filters.dateFrom;
    if (filters?.dateTo) params.date_to = filters.dateTo;
    if (filters?.limit) params.limit = filters.limit;

    return request<PrintOperation[]>({
      url: '/printing/history',
      method: 'GET',
      params,
    });
  },

  // Get statistics
  getStatistics: async (branchId?: number): Promise<PrintStatistics> => {
    const params: any = {};
    if (branchId !== undefined) params.branch_id = branchId;

    return request<PrintStatistics>({
      url: '/printing/statistics',
      method: 'GET',
      params,
    });
  },
};

