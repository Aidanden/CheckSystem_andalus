import { InventoryModel } from '../models/Inventory.model';
import { Inventory, InventoryTransaction } from '@prisma/client';
import { StockType, AddInventoryRequest } from '../types';

export class InventoryService {
  static async getAllInventory(): Promise<Inventory[]> {
    return InventoryModel.findAll();
  }

  static async getInventoryByStockType(stockType: StockType): Promise<Inventory> {
    const inventory = await InventoryModel.findByStockType(stockType);
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  }

  static async getAvailableQuantity(stockType: StockType): Promise<number> {
    return InventoryModel.getAvailableQuantity(stockType);
  }

  static async addInventory(data: AddInventoryRequest, userId: number): Promise<void> {
    if (data.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    await InventoryModel.addStock(
      data.stock_type,
      data.quantity,
      userId,
      data.serial_from,
      data.serial_to,
      data.notes
    );
  }

  static async deductInventory(
    stockType: StockType,
    quantity: number,
    userId: number,
    notes?: string
  ): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const success = await InventoryModel.deductStock(stockType, quantity, userId, notes);
    if (!success) {
      throw new Error('Insufficient inventory');
    }
  }

  static async getTransactionHistory(
    stockType?: StockType,
    limit: number = 100
  ): Promise<InventoryTransaction[]> {
    return InventoryModel.getTransactionHistory(stockType, limit);
  }

  static async checkAvailability(stockType: StockType, requiredQuantity: number): Promise<boolean> {
    const available = await InventoryModel.getAvailableQuantity(stockType);
    return available >= requiredQuantity;
  }
}
