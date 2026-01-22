import prisma from '../lib/prisma';
import { PrintOperation, Prisma } from '@prisma/client';

export class PrintOperationModel {
  static async create(operation: {
    accountId: number;
    userId: number;
    branchId: number;
    routingNumber: string;
    accountNumber: string;
    accountType: number;
    serialFrom: number;
    serialTo: number;
    sheetsPrinted: number;
    status?: string;
    notes?: string;
    pdfFilename?: string;
  }): Promise<PrintOperation> {
    return prisma.printOperation.create({
      data: {
        accountId: operation.accountId,
        userId: operation.userId,
        branchId: operation.branchId,
        routingNumber: operation.routingNumber,
        accountNumber: operation.accountNumber,
        accountType: operation.accountType,
        serialFrom: operation.serialFrom,
        serialTo: operation.serialTo,
        sheetsPrinted: operation.sheetsPrinted,
        status: operation.status || 'COMPLETED',
        notes: operation.notes,
        pdfFilename: operation.pdfFilename,
      },
    });
  }

  static async findAll(limit: number = 100): Promise<PrintOperation[]> {
    return prisma.printOperation.findMany({
      orderBy: { printDate: 'desc' },
      take: limit,
    });
  }

  static async findById(id: number): Promise<PrintOperation | null> {
    return prisma.printOperation.findUnique({
      where: { id },
    });
  }

  static async findByAccountId(accountId: number): Promise<PrintOperation[]> {
    return prisma.printOperation.findMany({
      where: { accountId },
      orderBy: { printDate: 'desc' },
    });
  }

  static async findByUserId(userId: number, limit: number = 100): Promise<PrintOperation[]> {
    return prisma.printOperation.findMany({
      where: { userId },
      orderBy: { printDate: 'desc' },
      take: limit,
    });
  }

  static async findByBranchId(branchId: number, limit: number = 100): Promise<PrintOperation[]> {
    return prisma.printOperation.findMany({
      where: { branchId },
      orderBy: { printDate: 'desc' },
      take: limit,
    });
  }

  static async findByDateRange(
    startDate: Date,
    endDate: Date,
    branchId?: number
  ): Promise<PrintOperation[]> {
    return prisma.printOperation.findMany({
      where: {
        printDate: {
          gte: startDate,
          lte: endDate,
        },
        branchId: branchId !== undefined ? branchId : undefined,
      },
      orderBy: { printDate: 'desc' },
    });
  }

  static async getStatistics(branchId?: number): Promise<any> {
    const where: Prisma.PrintOperationWhereInput = branchId
      ? { branchId }
      : {};

    const stats = await prisma.printOperation.aggregate({
      where,
      _count: {
        id: true,
      },
      _sum: {
        sheetsPrinted: true,
      },
      _min: {
        printDate: true,
      },
      _max: {
        printDate: true,
      },
    });

    const corporate50 = await prisma.printOperation.count({
      where: {
        ...where,
        sheetsPrinted: 50,
      },
    });

    const individual25 = await prisma.printOperation.count({
      where: {
        ...where,
        sheetsPrinted: 25,
      },
    });

    const employees10 = await prisma.printOperation.count({
      where: {
        ...where,
        sheetsPrinted: 10,
      },
    });

    return {
      total_operations: stats._count.id?.toString() || '0',
      total_sheets_printed: stats._sum.sheetsPrinted?.toString() || '0',
      corporate_50: corporate50.toString(),
      individual_25: individual25.toString(),
      employees_10: employees10.toString(),
      first_print_date: stats._min.printDate,
      last_print_date: stats._max.printDate,
    };
  }
}
