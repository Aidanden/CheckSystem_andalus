import { request } from '../client';
import { Inventory, InventoryTransaction, AddInventoryRequest } from '@/types';

export const inventoryService = {
  // Get all inventory
  getAll: async (): Promise<Inventory[]> => {
    return request<Inventory[]>({
      url: '/inventory',
      method: 'GET',
    });
  },

  // Get inventory by stock type
  getByStockType: async (stockType: 1 | 2 | 3): Promise<Inventory> => {
    return request<Inventory>({
      url: `/inventory/${stockType}`,
      method: 'GET',
    });
  },

  // Add inventory
  addStock: async (data: AddInventoryRequest): Promise<{ message: string }> => {
    return request<{ message: string }>({
      url: '/inventory/add',
      method: 'POST',
      data,
    });
  },

  // Get transaction history
  getTransactionHistory: async (stockType?: 1 | 2 | 3, limit?: number): Promise<InventoryTransaction[]> => {
    const params: any = {};
    if (stockType !== undefined) params.stock_type = stockType;
    if (limit) params.limit = limit;

    return request<InventoryTransaction[]>({
      url: '/inventory/transactions/history',
      method: 'GET',
      params,
    });
  },
};

