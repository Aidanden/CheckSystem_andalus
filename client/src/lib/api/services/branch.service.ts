import { request } from '../client';
import { Branch, CreateBranchRequest } from '@/types';

export const branchService = {
  // Get all branches
  getAll: async (): Promise<Branch[]> => {
    return request<Branch[]>({
      url: '/branches',
      method: 'GET',
    });
  },

  // Get branch by ID
  getById: async (id: number): Promise<Branch> => {
    return request<Branch>({
      url: `/branches/${id}`,
      method: 'GET',
    });
  },

  // Get branch by core code
  getByCode: async (code: string): Promise<Branch> => {
    return request<Branch>({
      url: `/branches/code/${code}`,
      method: 'GET',
    });
  },

  // Get branch by account number (extracts first 3 digits automatically in backend)
  getByAccountNumber: async (accountNumber: string): Promise<Branch> => {
    return request<Branch>({
      url: `/branches/account/${accountNumber}`,
      method: 'GET',
    });
  },

  // Create branch
  create: async (data: CreateBranchRequest): Promise<Branch> => {
    return request<Branch>({
      url: '/branches',
      method: 'POST',
      data,
    });
  },

  // Update branch
  update: async (id: number, data: Partial<CreateBranchRequest>): Promise<Branch> => {
    return request<Branch>({
      url: `/branches/${id}`,
      method: 'PUT',
      data,
    });
  },

  // Delete branch
  delete: async (id: number): Promise<{ message: string }> => {
    return request<{ message: string }>({
      url: `/branches/${id}`,
      method: 'DELETE',
    });
  },
};

