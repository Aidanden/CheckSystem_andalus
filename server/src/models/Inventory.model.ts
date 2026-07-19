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
      const existing = await tx.inventory.findFirst({
        where: { stockType },
      });

      if (existing) {
        await tx.inventory.update({
          where: { id: existing.id },
          data: {
            quantity: { increment: quantity },
          },
        });
      } else {
        await tx.inventory.create({
          data: {
            stockType,
            quantity,
          },
        });
      }

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
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findFirst({
        where: { stockType },
      });

      const currentQuantity = inventory?.quantity || 0;
      if (!inventory || currentQuantity < quantity) {
        throw new Error(
          `لا يوجد مخزون كافٍ. المطلوب: ${quantity} ورقة، المتاح: ${currentQuantity} ورقة`
        );
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { decrement: quantity },
        },
      });

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
