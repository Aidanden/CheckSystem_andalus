import { Request, Response } from 'express';
import { CertifiedCheckModel } from '../models/CertifiedCheck.model';
import { BranchModel } from '../models/Branch.model';
import { PrintSettingsModel } from '../models/PrintSettings.model';
import { InventoryService } from '../services/inventory.service';
import { StockType } from '../types';

// Get branches available for certified check printing
export const getBranches = async (req: Request, res: Response) => {
    try {
        const branches = await BranchModel.findAll();

        // Get serial info for each branch
        const branchesWithSerials = await Promise.all(
            branches.map(async (branch) => {
                const lastSerial = await CertifiedCheckModel.getLastSerial(branch.id);
                return {
                    ...branch,
                    lastSerial,
                };
            })
        );

        res.json(branchesWithSerials);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ error: 'فشل في جلب الفروع' });
    }
};

// Get next serial range for a branch
export const getNextSerialRange = async (req: Request, res: Response) => {
    try {
        const branchId = parseInt(req.params.branchId);
        if (isNaN(branchId)) {
            return res.status(400).json({ error: 'رقم الفرع غير صالح' });
        }

        const branch = await BranchModel.findById(branchId);
        if (!branch) {
            return res.status(404).json({ error: 'الفرع غير موجود' });
        }

        // الحصول على المعاملات من query string
        const customStartSerial = req.query.customStartSerial
            ? parseInt(req.query.customStartSerial as string)
            : undefined;
        const numberOfBooks = req.query.numberOfBooks
            ? parseInt(req.query.numberOfBooks as string)
            : 1;
        const checksPerBook = 50;
        const totalChecks = numberOfBooks * checksPerBook;

        const range = await CertifiedCheckModel.getNextSerialRange(
            branchId,
            totalChecks,
            customStartSerial
        );

        return res.json({
            branchId,
            branchName: branch.branchName,
            accountingNumber: branch.accountingNumber,
            routingNumber: branch.routingNumber,
            ...range,
            numberOfBooks,
            checksPerBook,
            totalChecks,
        });
    } catch (error) {
        console.error('Error getting next serial range:', error);
        return res.status(500).json({ error: 'فشل في جلب نطاق الأرقام التسلسلية' });
    }
};

// Print a new certified check book
export const printBook = async (req: Request, res: Response) => {
    try {
        const { branchId, notes, customStartSerial, numberOfBooks } = req.body;
        const user = (req as any).user;

        if (!user || !user.userId) {
            return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
        }

        if (!branchId) {
            return res.status(400).json({ error: 'يرجى تحديد الفرع' });
        }

        const branch = await BranchModel.findById(branchId);
        if (!branch) {
            return res.status(404).json({ error: 'الفرع غير موجود' });
        }

        if (!branch.accountingNumber) {
            return res.status(400).json({ error: 'الفرع ليس لديه رقم محاسبي. يرجى تحديثه أولاً.' });
        }

        if (!branch.routingNumber) {
            return res.status(400).json({ error: 'الفرع ليس لديه رقم توجيهي. يرجى تحديثه أولاً.' });
        }

        // التحقق من عدد الدفاتر
        const booksCount = numberOfBooks && numberOfBooks > 0 ? numberOfBooks : 1;
        const checksPerBook = 50;
        const totalChecks = booksCount * checksPerBook;

        // الحصول على نطاق التسلسل
        const startSerial = customStartSerial && customStartSerial > 0
            ? parseInt(customStartSerial.toString())
            : undefined;

        const range = await CertifiedCheckModel.getNextSerialRange(
            branchId,
            totalChecks,
            startSerial
        );

        // التحقق من عدم التكرار عبر جميع الفروع
        const overlapResult = await CertifiedCheckModel.checkSerialOverlap(
            branchId,
            range.firstSerial,
            range.lastSerial
        );

        if (overlapResult.hasOverlap) {
            const errorMessage = overlapResult.conflictingBranch
                ? `الأرقام التسلسلية من ${range.firstSerial} إلى ${range.lastSerial} مستخدمة بالفعل من قبل فرع "${overlapResult.conflictingBranch}"`
                : `الأرقام التسلسلية من ${range.firstSerial} إلى ${range.lastSerial} متداخلة مع عملية طباعة سابقة`;
            return res.status(400).json({ error: errorMessage });
        }

        const log = await CertifiedCheckModel.printBook({
            branchId,
            branchName: branch.branchName,
            accountingNumber: branch.accountingNumber,
            routingNumber: branch.routingNumber,
            firstSerial: range.firstSerial,
            lastSerial: range.lastSerial,
            totalChecks,
            numberOfBooks: booksCount,
            customStartSerial: startSerial,
            operationType: 'print',
            printedBy: user.userId,
            printedByName: user.username,
            notes,
        });

        // خصم من المخزون
        try {
            await InventoryService.deductInventory(
                StockType.CERTIFIED,
                totalChecks,
                user.userId,
                `إصدار دفاتر صكوك مصدقة لفرع ${branch.branchName} (${range.firstSerial} - ${range.lastSerial})`
            );
        } catch (invError) {
            console.error('Error deducting inventory:', invError);
            // We continue even if inventory deduction fails, but we log it
        }

        return res.json({
            success: true,
            log,
            printData: {
                branchId,
                branchName: branch.branchName,
                accountingNumber: branch.accountingNumber,
                routingNumber: branch.routingNumber,
                firstSerial: range.firstSerial,
                lastSerial: range.lastSerial,
                numberOfBooks: booksCount,
                checksPerBook,
                totalChecks,
            },
        });
    } catch (error: any) {
        console.error('Error printing certified check book:', error);
        const errorMessage = error.message || 'فشل في طباعة دفتر الصكوك المصدقة';
        return res.status(500).json({ error: errorMessage });
    }
};

// Reprint a certified check book from logs
export const reprintBook = async (req: Request, res: Response) => {
    try {
        const logId = parseInt(req.params.logId);
        const { firstSerial, lastSerial, reprintReason } = req.body;
        const user = (req as any).user;

        if (!user || !user.userId) {
            return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
        }

        if (isNaN(logId)) {
            return res.status(400).json({ error: 'رقم السجل غير صالح' });
        }

        if (!reprintReason || (reprintReason !== 'damaged' && reprintReason !== 'not_printed')) {
            return res.status(400).json({ error: 'يجب اختيار سبب إعادة الطباعة: damaged أو not_printed' });
        }

        const originalLog = await CertifiedCheckModel.findLogById(logId);
        if (!originalLog) {
            return res.status(404).json({ error: 'السجل غير موجود' });
        }

        // استخدام النطاق المحدد أو النطاق الأصلي
        const reprintFirstSerial = firstSerial || originalLog.firstSerial;
        const reprintLastSerial = lastSerial || originalLog.lastSerial;

        // التحقق من أن النطاق ضمن النطاق الأصلي
        if (reprintFirstSerial < originalLog.firstSerial || reprintLastSerial > originalLog.lastSerial) {
            return res.status(400).json({
                error: `النطاق يجب أن يكون ضمن النطاق الأصلي (${originalLog.firstSerial} - ${originalLog.lastSerial})`
            });
        }

        if (reprintFirstSerial > reprintLastSerial) {
            return res.status(400).json({ error: 'رقم البداية يجب أن يكون أصغر من أو يساوي رقم النهاية' });
        }

        const reprintTotalChecks = reprintLastSerial - reprintFirstSerial + 1;

        // Create a new log for the reprint
        const log = await CertifiedCheckModel.printBook({
            branchId: originalLog.branchId,
            branchName: originalLog.branchName,
            accountingNumber: originalLog.accountingNumber,
            routingNumber: originalLog.routingNumber,
            firstSerial: reprintFirstSerial,
            lastSerial: reprintLastSerial,
            totalChecks: reprintTotalChecks,
            numberOfBooks: Math.ceil(reprintTotalChecks / 50),
            customStartSerial: undefined, // لا نستخدم custom serial في إعادة الطباعة
            operationType: 'reprint',
            reprintReason: reprintReason as 'damaged' | 'not_printed',
            printedBy: user.userId,
            printedByName: user.username,
            notes: `إعادة طباعة للسجل رقم ${logId}`,
        });

        // خصم من المخزون في حالة إعادة الطباعة (لأننا نستخدم أوراقاً جديدة)
        try {
            await InventoryService.deductInventory(
                StockType.CERTIFIED,
                reprintTotalChecks,
                user.userId,
                `إعادة طباعة صكوك مصدقة لفرع ${originalLog.branchName} (${reprintFirstSerial} - ${reprintLastSerial})`
            );
        } catch (invError) {
            console.error('Error deducting inventory for reprint:', invError);
        }

        return res.json({
            success: true,
            log,
            printData: {
                branchId: originalLog.branchId,
                branchName: originalLog.branchName,
                accountingNumber: originalLog.accountingNumber,
                routingNumber: originalLog.routingNumber,
                firstSerial: reprintFirstSerial,
                lastSerial: reprintLastSerial,
                checksCount: reprintTotalChecks,
                numberOfBooks: Math.ceil(reprintTotalChecks / 50),
                totalChecks: reprintTotalChecks,
                checksPerBook: 50,
            },
        });
    } catch (error) {
        console.error('Error reprinting certified check book:', error);
        return res.status(500).json({ error: 'فشل في إعادة طباعة دفتر الصكوك المصدقة' });
    }
};

// Get print logs
export const getLogs = async (req: Request, res: Response) => {
    try {
        const skip = parseInt(req.query.skip as string) || 0;
        const take = parseInt(req.query.take as string) || 20;
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
        const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        let endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        // ضبط نهاية اليوم لتشمل كافة العمليات في ذلك التاريخ
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        const { logs, total } = await CertifiedCheckModel.findAllLogs({
            skip,
            take,
            branchId,
            userId,
            startDate,
            endDate,
        });

        res.json({ logs, total, skip, take });
    } catch (error) {
        console.error('Error fetching certified check logs:', error);
        res.status(500).json({ error: 'فشل في جلب سجلات الطباعة' });
    }
};

// Get statistics
export const getStatistics = async (req: Request, res: Response) => {
    try {
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
        const stats = await CertifiedCheckModel.getStatistics(branchId);
        const branchSerials = await CertifiedCheckModel.getAllBranchSerials();

        res.json({
            ...stats,
            branchSerials,
        });
    } catch (error) {
        console.error('Error fetching certified check statistics:', error);
        res.status(500).json({ error: 'فشل في جلب الإحصائيات' });
    }
};

// Get print settings for certified checks (accountType = 4)
export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await PrintSettingsModel.getOrDefault(4);
        res.json(settings);
    } catch (error) {
        console.error('Error fetching certified check settings:', error);
        res.status(500).json({ error: 'فشل في جلب إعدادات الطباعة' });
    }
};

// Update print settings for certified checks
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        console.log('Updating certified check settings with data:', data);

        const settings = await PrintSettingsModel.upsert({
            accountType: 4,
            checkWidth: data.checkWidth,
            checkHeight: data.checkHeight,
            branchNameX: data.branchName?.x ?? data.branchNameX ?? 145,
            branchNameY: data.branchName?.y ?? data.branchNameY ?? 5,
            branchNameFontSize: data.branchName?.fontSize ?? data.branchNameFontSize ?? 8,
            branchNameAlign: data.branchName?.align ?? data.branchNameAlign ?? 'center',
            serialNumberX: data.serialNumber?.x ?? data.serialNumberX ?? 215,
            serialNumberY: data.serialNumber?.y ?? data.serialNumberY ?? 18,
            serialNumberFontSize: data.serialNumber?.fontSize ?? data.serialNumberFontSize ?? 8,
            serialNumberAlign: data.serialNumber?.align ?? data.serialNumberAlign ?? 'right',
            accountNumberX: data.accountNumberX ?? data.accountNumber?.x ?? 0,
            accountNumberY: data.accountNumberY ?? data.accountNumber?.y ?? 0,
            accountNumberFontSize: data.accountNumberFontSize ?? data.accountNumber?.fontSize ?? 0,
            accountNumberAlign: data.accountNumberAlign ?? data.accountNumber?.align ?? 'center',
            checkSequenceX: data.checkSequenceX ?? data.checkSequence?.x ?? 20,
            checkSequenceY: data.checkSequenceY ?? data.checkSequence?.y ?? 18,
            checkSequenceFontSize: data.checkSequenceFontSize ?? data.checkSequence?.fontSize ?? 8,
            checkSequenceAlign: data.checkSequenceAlign ?? data.checkSequence?.align ?? 'left',
            accountHolderNameX: data.accountHolderNameX ?? data.accountHolderName?.x ?? -1000,
            accountHolderNameY: data.accountHolderNameY ?? data.accountHolderName?.y ?? -1000,
            accountHolderNameFontSize: data.accountHolderNameFontSize ?? data.accountHolderName?.fontSize ?? 0,
            accountHolderNameAlign: data.accountHolderNameAlign ?? data.accountHolderName?.align ?? 'left',
            micrLineX: data.micrLineX ?? data.micrLine?.x ?? 138,
            micrLineY: data.micrLineY ?? data.micrLine?.y ?? 70,
            micrLineFontSize: data.micrLineFontSize ?? data.micrLine?.fontSize ?? 14,
            micrLineAlign: data.micrLineAlign ?? data.micrLine?.align ?? 'center',

            // New fields
            beneficiaryNameX: data.beneficiaryNameX,
            beneficiaryNameY: data.beneficiaryNameY,
            beneficiaryNameFontSize: data.beneficiaryNameFontSize,
            beneficiaryNameAlign: data.beneficiaryNameAlign,
            amountNumbersX: data.amountNumbersX,
            amountNumbersY: data.amountNumbersY,
            amountNumbersFontSize: data.amountNumbersFontSize,
            amountNumbersAlign: data.amountNumbersAlign,
            amountWordsX: data.amountWordsX,
            amountWordsY: data.amountWordsY,
            amountWordsFontSize: data.amountWordsFontSize,
            amountWordsAlign: data.amountWordsAlign,
            issueDateX: data.issueDateX,
            issueDateY: data.issueDateY,
            issueDateFontSize: data.issueDateFontSize,
            issueDateAlign: data.issueDateAlign,
            checkTypeX: data.checkTypeX,
            checkTypeY: data.checkTypeY,
            checkTypeFontSize: data.checkTypeFontSize,
            checkTypeAlign: data.checkTypeAlign,
            checkNumberX: data.checkNumberX,
            checkNumberY: data.checkNumberY,
            checkNumberFontSize: data.checkNumberFontSize,
            checkNumberAlign: data.checkNumberAlign,
        });

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error updating certified check settings:', error);
        res.status(500).json({ error: 'فشل في حفظ إعدادات الطباعة' });
    }
};

// Save individual certified check print record
export const savePrintRecord = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user = (req as any).user;

        if (!user || !user.userId) {
            return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
        }

        const record = await CertifiedCheckModel.savePrintRecord({
            ...data,
            createdBy: user.userId,
            createdByName: user.username,
        });

        return res.json({ success: true, record });
    } catch (error: any) {
        console.error('Error saving print record:', error);
        const message = error.code === 'P2002' ? 'رقم الشيك مكرر ومسجل مسبقاً' : 'فشل في حفظ سجل الطباعة';
        return res.status(500).json({ error: message });
    }
};

// Update individual certified check print record
export const updatePrintRecord = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const user = (req as any).user;

        if (!user || !user.userId) {
            return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
        }

        if (!id) {
            return res.status(400).json({ error: 'معرف السجل مطلوب' });
        }

        const record = await CertifiedCheckModel.updatePrintRecord(Number(id), data);

        return res.json({ success: true, record });
    } catch (error: any) {
        console.error('Error updating print record:', error);
        const message = error.code === 'P2002' ? 'رقم الشيك مكرر ومسجل مسبقاً' : 'فشل في تحديث سجل الطباعة';
        return res.status(500).json({ error: message });
    }
};

// Get individual certified check print records
export const getPrintRecords = async (req: Request, res: Response) => {
    try {
        const skip = parseInt(req.query.skip as string) || 0;
        const take = parseInt(req.query.take as string) || 20;
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
        const search = req.query.search as string;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        let endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        const { records, total } = await CertifiedCheckModel.findAllRecords({
            skip,
            take,
            branchId,
            search,
            startDate,
            endDate,
        });

        return res.json({ records, total, skip, take });
    } catch (error) {
        console.error('Error fetching print records:', error);
        return res.status(500).json({ error: 'فشل في جلب سجلات الطباعة' });
    }
};

// Get individual certified check statistics
export const getRecordStatistics = async (req: Request, res: Response) => {
    try {
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
        const stats = await CertifiedCheckModel.getRecordStatistics(branchId);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching record statistics:', error);
        res.status(500).json({ error: 'فشل في جلب الإحصائيات' });
    }
};
