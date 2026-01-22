import prisma from '../lib/prisma';
import { Inventory, InventoryTransaction } from '@prisma/client';

export class InventoryModel {
  static async findAll(): Promise<Inventory[]> {
    return prisma.inventory.findMany({
      orderBy: { stockType: 'asc' },
    });
  }

  static async findByStockType(stockType: number): Promise<Inventory | null> {
    return prisma.inventory.findFirst({
      where: { stockType },
    });
  }

  static async getAvailableQuantity(stockType: number): Promise<number> {
    const inventory = await prisma.inventory.findFirst({
      where: { stockType },
      select: { quantity: true },
    });
    
    return inventory?.quantity || 0;
  }

  static async addStock(
    stockType: number,
    quantity: number,
    userId: number,
    serialFrom?: string,
    serialTo?: string,
    notes?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Update inventory
      await tx.inventory.updateMany({
        where: { stockType },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });

      // Record transaction
      await tx.inventoryTransaction.create({
        data: {
          stockType,
          transactionType: 'ADD',
          quantity,
          serialFrom,
          serialTo,
          userId,
          notes,
        },
      });
    });
  }

  static async deductStock(
    stockType: number,
    quantity: number,
    userId: number,
    notes?: string
  ): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        // Check available quantity
        const inventory = await tx.inventory.findFirst({
          where: { stockType },
          select: { quantity: true },
        });

        const currentQuantity = inventory?.quantity || 0;
        if (currentQuantity < quantity) {
          throw new Error('Insufficient inventory');
        }

        // Update inventory
        await tx.inventory.updateMany({
          where: { stockType },
          data: {
            quantity: {
              decrement: quantity,
            },
          },
        });

        // Record transaction
        await tx.inventoryTransaction.create({
          data: {
            stockType,
            transactionType: 'DEDUCT',
            quantity,
            userId,
            notes,
          },
        });
      });

      return true;
    } catch {
      return false;
    }
  }

  static async getTransactionHistory(
    stockType?: number,
    limit: number = 100
  ): Promise<InventoryTransaction[]> {
    return prisma.inventoryTransaction.findMany({
      where: stockType !== undefined ? { stockType } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
