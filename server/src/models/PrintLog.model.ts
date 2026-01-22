import prisma from '../lib/prisma';
import { PrintLog, PrintedCheque } from '@prisma/client';

export interface CreatePrintLogData {
  accountNumber: string;
  accountBranch: string;
  branchName?: string;
  firstChequeNumber: number;
  lastChequeNumber: number;
  totalCheques: number;
  accountType: number;
  operationType: 'print' | 'reprint';
  reprintReason?: 'damaged' | 'not_printed'; // سبب إعادة الطباعة: 'damaged' = تالفة، 'not_printed' = لم تطبع
  printedBy: number;
  printedByName: string;
  notes?: string;
  chequeNumbers: number[];
}

export class PrintLogModel {
  // إنشاء سجل طباعة جديد
  static async create(data: CreatePrintLogData): Promise<PrintLog> {
    return prisma.$transaction(async (tx) => {
      // إنشاء سجل الطباعة
      const printLog = await tx.printLog.create({
        data: {
          accountNumber: data.accountNumber,
          accountBranch: data.accountBranch,
          branchName: data.branchName,
          firstChequeNumber: data.firstChequeNumber,
          lastChequeNumber: data.lastChequeNumber,
          totalCheques: data.totalCheques,
          accountType: data.accountType,
          operationType: data.operationType,
          ...(data.reprintReason ? { reprintReason: data.reprintReason } : {}),
          printedBy: data.printedBy,
          printedByName: data.printedByName,
          notes: data.notes,
        },
      });

      // تسجيل كل شيك تم طباعته
      if (data.chequeNumbers && data.chequeNumbers.length > 0) {
        await tx.printedCheque.createMany({
          data: data.chequeNumbers.map((chequeNumber) => ({
            accountNumber: data.accountNumber,
            chequeNumber,
            printLogId: printLog.id,
            canReprint: data.operationType === 'reprint',
          })),
          skipDuplicates: true, // تجاهل الشيكات المطبوعة مسبقاً
        });
      }

      return printLog;
    });
  }

  // التحقق من أن الشيك تم طباعته مسبقاً
  static async isChequeAlreadyPrinted(
    accountNumber: string,
    chequeNumber: number
  ): Promise<boolean> {
    const printed = await prisma.printedCheque.findUnique({
      where: {
        accountNumber_chequeNumber: {
          accountNumber,
          chequeNumber,
        },
      },
    });
    return !!printed;
  }

  // التحقق من قائمة شيكات
  static async checkPrintedCheques(
    accountNumber: string,
    chequeNumbers: number[]
  ): Promise<{ chequeNumber: number; isPrinted: boolean; canReprint: boolean }[]> {
    const printedCheques = await prisma.printedCheque.findMany({
      where: {
        accountNumber,
        chequeNumber: { in: chequeNumbers },
      },
    });

    const printedMap = new Map(
      printedCheques.map((pc) => [pc.chequeNumber, pc])
    );

    return chequeNumbers.map((chequeNumber) => {
      const printed = printedMap.get(chequeNumber);
      return {
        chequeNumber,
        isPrinted: !!printed,
        canReprint: printed?.canReprint || false,
      };
    });
  }

  // جلب جميع السجلات
  static async findAll(options?: {
    skip?: number;
    take?: number;
    operationType?: 'print' | 'reprint';
    accountNumber?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: number;
  }): Promise<{ logs: PrintLog[]; total: number }> {
    const where: any = {};

    if (options?.operationType) {
      where.operationType = options.operationType;
    }

    if (options?.accountNumber) {
      where.accountNumber = { contains: options.accountNumber };
    }

    if (options?.userId) {
      where.printedBy = options.userId;
    }

    if (options?.startDate || options?.endDate) {
      where.printDate = {};
      if (options.startDate) {
        where.printDate.gte = options.startDate;
      }
      if (options.endDate) {
        where.printDate.lte = options.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.printLog.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { printDate: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.printLog.count({ where }),
    ]);

    return { logs, total };
  }

  // جلب سجل واحد
  static async findById(id: number): Promise<PrintLog | null> {
    return prisma.printLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  // السماح بإعادة الطباعة
  static async allowReprint(
    accountNumber: string,
    chequeNumbers: number[]
  ): Promise<void> {
    await prisma.printedCheque.updateMany({
      where: {
        accountNumber,
        chequeNumber: { in: chequeNumbers },
      },
      data: {
        canReprint: true,
      },
    });
  }
  static async getReprintStatistics(branchId?: number): Promise<{ operations: number, sheets: number }> {
    const where: any = {
      operationType: 'reprint'
    };

    if (branchId) {
      where.user = {
        branchId: branchId
      };
    }

    const stats = await prisma.printLog.aggregate({
      where,
      _count: {
        id: true,
      },
      _sum: {
        totalCheques: true,
      },
    });

    return {
      operations: stats._count.id || 0,
      sheets: stats._sum.totalCheques || 0
    };
  }
}
