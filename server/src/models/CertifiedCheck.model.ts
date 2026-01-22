import prisma from '../lib/prisma';
import { CertifiedCheckLog, CertifiedCheckSerial } from '@prisma/client';

export interface CreateCertifiedCheckLogData {
    branchId: number;
    branchName: string;
    accountingNumber: string;
    routingNumber: string;
    firstSerial: number;
    lastSerial: number;
    totalChecks: number;
    numberOfBooks?: number; // عدد الدفاتر
    customStartSerial?: number; // بداية التسلسل المخصصة
    operationType: 'print' | 'reprint';
    reprintReason?: 'damaged' | 'not_printed'; // سبب إعادة الطباعة
    printedBy: number;
    printedByName: string;
    notes?: string;
}

export class CertifiedCheckModel {
    // Get or create serial tracker for a branch
    static async getOrCreateSerial(branchId: number): Promise<CertifiedCheckSerial> {
        let serial = await prisma.certifiedCheckSerial.findUnique({
            where: { branchId },
        });

        if (!serial) {
            serial = await prisma.certifiedCheckSerial.create({
                data: {
                    branchId,
                    lastSerial: 0,
                },
            });
        }

        return serial;
    }

    // Get next serial range for printing (50 checks per book)
    static async getNextSerialRange(
        branchId: number,
        checksCount: number = 50,
        customStartSerial?: number
    ): Promise<{ firstSerial: number; lastSerial: number }> {
        const serial = await this.getOrCreateSerial(branchId);

        let firstSerial: number;
        if (customStartSerial !== undefined && customStartSerial > 0) {
            // استخدام بداية التسلسل المخصصة
            firstSerial = customStartSerial;
        } else {
            // استخدام التسلسل التلقائي
            firstSerial = serial.lastSerial + 1;
        }

        const lastSerial = firstSerial + checksCount - 1;
        return { firstSerial, lastSerial };
    }

    // التحقق من عدم تداخل الأرقام التسلسلية عبر جميع الفروع
    static async checkSerialOverlap(
        branchId: number,
        firstSerial: number,
        lastSerial: number,
        excludeLogId?: number
    ): Promise<{ hasOverlap: boolean; conflictingBranch?: string }> {
        const where: any = {
            // إزالة فلتر branchId للتحقق عبر جميع الفروع
            OR: [
                // تداخل من البداية
                {
                    AND: [
                        { firstSerial: { lte: firstSerial } },
                        { lastSerial: { gte: firstSerial } }
                    ]
                },
                // تداخل من النهاية
                {
                    AND: [
                        { firstSerial: { lte: lastSerial } },
                        { lastSerial: { gte: lastSerial } }
                    ]
                },
                // احتواء كامل
                {
                    AND: [
                        { firstSerial: { gte: firstSerial } },
                        { lastSerial: { lte: lastSerial } }
                    ]
                }
            ]
        };

        if (excludeLogId) {
            where.id = { not: excludeLogId };
        }

        const overlapping = await prisma.certifiedCheckLog.findFirst({
            where,
            include: {
                branch: {
                    select: {
                        branchName: true,
                    }
                }
            }
        });

        if (overlapping) {
            return {
                hasOverlap: true,
                conflictingBranch: overlapping.branchName
            };
        }

        return { hasOverlap: false };
    }

    // Print a new certified check book
    static async printBook(data: CreateCertifiedCheckLogData): Promise<CertifiedCheckLog> {
        return prisma.$transaction(async (tx) => {
            // التحقق من عدم تداخل الأرقام التسلسلية (فقط لعمليات الطباعة الجديدة)
            if (data.operationType === 'print') {
                const overlapResult = await this.checkSerialOverlap(
                    data.branchId,
                    data.firstSerial,
                    data.lastSerial
                );

                if (overlapResult.hasOverlap) {
                    const errorMessage = overlapResult.conflictingBranch
                        ? `الأرقام التسلسلية من ${data.firstSerial} إلى ${data.lastSerial} مستخدمة بالفعل من قبل فرع "${overlapResult.conflictingBranch}"`
                        : `الأرقام التسلسلية من ${data.firstSerial} إلى ${data.lastSerial} متداخلة مع عملية طباعة سابقة`;
                    throw new Error(errorMessage);
                }
            }

            // Update the serial tracker
            const currentSerial = await tx.certifiedCheckSerial.findUnique({
                where: { branchId: data.branchId }
            });

            const newLastSerial = Math.max(currentSerial?.lastSerial || 0, data.lastSerial);

            const updateData: any = { lastSerial: newLastSerial };
            if (data.customStartSerial !== undefined) {
                updateData.customStartSerial = data.customStartSerial;
            }

            await tx.certifiedCheckSerial.upsert({
                where: { branchId: data.branchId },
                update: updateData,
                create: {
                    branchId: data.branchId,
                    lastSerial: data.lastSerial,
                    customStartSerial: data.customStartSerial,
                },
            });

            // Create the print log
            const log = await tx.certifiedCheckLog.create({
                data: {
                    branchId: data.branchId,
                    branchName: data.branchName,
                    accountingNumber: data.accountingNumber,
                    routingNumber: data.routingNumber,
                    firstSerial: data.firstSerial,
                    lastSerial: data.lastSerial,
                    totalChecks: data.totalChecks,
                    numberOfBooks: data.numberOfBooks || 1,
                    customStartSerial: data.customStartSerial,
                    operationType: data.operationType,
                    reprintReason: data.reprintReason || null,
                    printedBy: data.printedBy,
                    printedByName: data.printedByName,
                    notes: data.notes,
                },
            });

            return log;
        });
    }

    // Get all print logs
    static async findAllLogs(options?: {
        skip?: number;
        take?: number;
        branchId?: number;
        userId?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{ logs: CertifiedCheckLog[]; total: number }> {
        const where: any = {};

        if (options?.branchId) {
            where.branchId = options.branchId;
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
            prisma.certifiedCheckLog.findMany({
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
                    branch: {
                        select: {
                            id: true,
                            branchName: true,
                        },
                    },
                },
            }),
            prisma.certifiedCheckLog.count({ where }),
        ]);

        return { logs, total };
    }

    // Get log by ID
    static async findLogById(id: number): Promise<CertifiedCheckLog | null> {
        return prisma.certifiedCheckLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        branchName: true,
                    },
                },
            },
        });
    }

    // Get last printed serial for a branch
    static async getLastSerial(branchId: number): Promise<number> {
        const serial = await prisma.certifiedCheckSerial.findUnique({
            where: { branchId },
        });
        return serial?.lastSerial || 0;
    }

    // Get statistics
    static async getStatistics(branchId?: number): Promise<{
        totalBooks: number;
        totalChecks: number;
        lastPrintDate: Date | null;
    }> {
        const where: any = {};
        if (branchId) {
            where.branchId = branchId;
        }

        const stats = await prisma.certifiedCheckLog.aggregate({
            where,
            _sum: {
                totalChecks: true,
                numberOfBooks: true, // مجموع عدد الدفاتر
            },
            _max: { printDate: true },
        });

        return {
            totalBooks: stats._sum.numberOfBooks || 0, // مجموع عدد الدفاتر وليس عدد السجلات
            totalChecks: stats._sum.totalChecks || 0,
            lastPrintDate: stats._max.printDate || null,
        };
    }

    // Get all branch serials with branch info
    static async getAllBranchSerials(): Promise<Array<{
        branchId: number;
        branchName: string;
        lastSerial: number;
    }>> {
        const serials = await prisma.certifiedCheckSerial.findMany({
            include: {
                branch: {
                    select: {
                        id: true,
                        branchName: true,
                    },
                },
            },
        });

        return serials.map(s => ({
            branchId: s.branchId,
            branchName: s.branch.branchName,
            lastSerial: s.lastSerial,
        }));
    }

    // Save an individual certified check print record
    static async savePrintRecord(data: {
        accountHolderName: string;
        beneficiaryName: string;
        accountNumber: string;
        amountDinars: string;
        amountDirhams: string;
        amountInWords: string;
        issueDate: string;
        checkType: string;
        checkNumber: string;
        branchId: number;
        createdBy: number;
        createdByName?: string;
    }) {
        return prisma.certifiedCheckPrintRecord.create({
            data: {
                accountHolderName: data.accountHolderName,
                beneficiaryName: data.beneficiaryName,
                accountNumber: data.accountNumber,
                amountDinars: data.amountDinars,
                amountDirhams: data.amountDirhams,
                amountInWords: data.amountInWords,
                issueDate: data.issueDate,
                checkType: data.checkType,
                checkNumber: data.checkNumber,
                branchId: data.branchId,
                createdBy: data.createdBy,
                createdByName: data.createdByName,
            },
        });
    }

    // Update an individual certified check print record
    static async updatePrintRecord(id: number, data: {
        accountHolderName: string;
        beneficiaryName: string;
        accountNumber: string;
        amountDinars: string;
        amountDirhams: string;
        amountInWords: string;
        issueDate: string;
        checkType: string;
        checkNumber: string;
        branchId: number;
    }) {
        return prisma.certifiedCheckPrintRecord.update({
            where: { id },
            data: {
                accountHolderName: data.accountHolderName,
                beneficiaryName: data.beneficiaryName,
                accountNumber: data.accountNumber,
                amountDinars: data.amountDinars,
                amountDirhams: data.amountDirhams,
                amountInWords: data.amountInWords,
                issueDate: data.issueDate,
                checkType: data.checkType,
                checkNumber: data.checkNumber,
                branchId: data.branchId,
            },
        });
    }

    static async findAllRecords(options?: {
        skip?: number;
        take?: number;
        branchId?: number;
        search?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const where: any = {};

        if (options?.branchId) {
            where.branchId = options.branchId;
        }

        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) {
                where.createdAt.gte = options.startDate;
            }
            if (options.endDate) {
                where.createdAt.lte = options.endDate;
            }
        }

        if (options?.search) {
            where.OR = [
                { beneficiaryName: { contains: options.search, mode: 'insensitive' } },
                { accountHolderName: { contains: options.search, mode: 'insensitive' } },
                { checkNumber: { contains: options.search, mode: 'insensitive' } },
                { accountNumber: { contains: options.search, mode: 'insensitive' } },
            ];
        }

        const [records, total] = await Promise.all([
            prisma.certifiedCheckPrintRecord.findMany({
                where,
                skip: options?.skip,
                take: options?.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    branch: true
                }
            }),
            prisma.certifiedCheckPrintRecord.count({ where }),
        ]);

        return { records, total };
    }

    static async getRecordStatistics(branchId?: number) {
        const where: any = {};
        if (branchId) {
            where.branchId = branchId;
        }

        const totalCount = await prisma.certifiedCheckPrintRecord.count({ where });

        // Summing amounts is tricky because they are strings (dinars/dirhams)
        // For a quick report, we can just return the count and maybe most recent
        const lastRecord = await prisma.certifiedCheckPrintRecord.findFirst({
            where,
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        return {
            totalRecords: totalCount,
            lastRecordDate: lastRecord?.createdAt || null,
        };
    }
}
