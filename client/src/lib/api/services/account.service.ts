import { request } from '../client';
import { Account } from '@/types';

export const accountService = {
  // Get all accounts
  getAll: async (): Promise<Account[]> => {
    return request<Account[]>({
      url: '/accounts',
      method: 'GET',
    });
  },

  // Get account by ID
  getById: async (id: number): Promise<Account> => {
    return request<Account>({
      url: `/accounts/${id}`,
      method: 'GET',
    });
  },

  // Query account (from bank)
  query: async (accountNumber: string): Promise<Account> => {
    return request<Account>({
      url: '/accounts/query',
      method: 'POST',
      data: { account_number: accountNumber },
    });
  },
};

