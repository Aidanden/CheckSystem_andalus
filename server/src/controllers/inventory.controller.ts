import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { InventoryService } from '../services/inventory.service';
import { AddInventoryRequest, StockType } from '../types';

export class InventoryController {
  static async getAll(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const inventory = await InventoryService.getAllInventory();
      res.json(inventory);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch inventory' });
      }
    }
  }

  static async getByStockType(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stockType = parseInt(req.params.stockType) as StockType;
      const inventory = await InventoryService.getInventoryByStockType(stockType);
      res.json(inventory);
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch inventory' });
      }
    }
  }

  static async addStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const data: AddInventoryRequest = req.body;
      await InventoryService.addInventory(data, req.user.userId);
      
      res.status(201).json({ 
        message: 'Inventory added successfully',
        stock_type: data.stock_type,
        quantity: data.quantity,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to add inventory' });
      }
    }
  }

  static async getTransactionHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stockType = req.query.stock_type 
        ? parseInt(req.query.stock_type as string) as StockType
        : undefined;
      const limit = req.query.limit 
        ? parseInt(req.query.limit as string)
        : 100;

      const transactions = await InventoryService.getTransactionHistory(stockType, limit);
      res.json(transactions);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch transaction history' });
      }
    }
  }
}

