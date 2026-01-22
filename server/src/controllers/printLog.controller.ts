import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrintLogService } from '../services/printLog.service';

export class PrintLogController {
  // إنشاء سجل طباعة جديد
  static async createLog(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        accountNumber,
        accountBranch,
        branchName,
        firstChequeNumber,
        lastChequeNumber,
        totalCheques,
        accountType,
        operationType,
        reprintReason,
        notes,
        chequeNumbers,
      } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'المستخدم غير مصرح' });
        return;
      }

      // التحقق من وجود سبب إعادة الطباعة عند إعادة الطباعة
      if (operationType === 'reprint' && !reprintReason) {
        res.status(400).json({ 
          error: 'يجب تحديد سبب إعادة الطباعة',
          details: 'الرجاء اختيار سبب إعادة الطباعة: ورقة تالفة أو ورقة لم تطبع'
        });
        return;
      }

      // التحقق من صحة سبب إعادة الطباعة
      if (operationType === 'reprint' && reprintReason && !['damaged', 'not_printed'].includes(reprintReason)) {
        res.status(400).json({ 
          error: 'سبب إعادة الطباعة غير صحيح',
          details: 'يجب أن يكون السبب إما "damaged" (تالفة) أو "not_printed" (لم تطبع)'
        });
        return;
      }

      const printLog = await PrintLogService.createPrintLog({
        accountNumber,
        accountBranch,
        branchName,
        firstChequeNumber,
        lastChequeNumber,
        totalCheques,
        accountType,
        operationType: operationType || 'print',
        reprintReason: reprintReason || undefined,
        printedBy: req.user.userId,
        printedByName: req.user.username,
        notes,
        chequeNumbers,
      });

      console.log('✅ تم إنشاء سجل طباعة:', {
        logId: printLog.id,
        accountNumber,
        operation: operationType,
        cheques: totalCheques,
      });

      res.json(printLog);
    } catch (error: any) {
      console.error('خطأ في إنشاء سجل الطباعة:', error);
      res.status(500).json({
        error: 'فشل في إنشاء سجل الطباعة',
        details: error.message,
      });
    }
  }

  // التحقق من حالة طباعة الشيكات
  static async checkPrintStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountNumber, chequeNumbers } = req.body;

      if (!accountNumber || !Array.isArray(chequeNumbers)) {
        res.status(400).json({ error: 'بيانات غير صحيحة' });
        return;
      }

      const status = await PrintLogService.checkChequesPrintStatus(
        accountNumber,
        chequeNumbers
      );

      res.json(status);
    } catch (error: any) {
      console.error('خطأ في التحقق من حالة الطباعة:', error);
      res.status(500).json({
        error: 'فشل في التحقق من حالة الطباعة',
        details: error.message,
      });
    }
  }

  // جلب جميع السجلات
  static async getAllLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        operationType,
        accountNumber,
        startDate,
        endDate,
        userId,
      } = req.query;

      // التحقق من الصلاحيات: فقط المدير يمكنه فلترة حسب أي مستخدم
      let finalUserId: number | undefined;
      if (userId) {
        if (req.user?.isAdmin) {
          finalUserId = parseInt(userId as string);
        } else {
          // المستخدمون العاديون يمكنهم فقط رؤية سجلاتهم الخاصة
          finalUserId = req.user?.userId;
        }
      }

      const result = await PrintLogService.getAllLogs({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        operationType: operationType as 'print' | 'reprint' | undefined,
        accountNumber: accountNumber as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        userId: finalUserId,
      });

      res.json(result);
    } catch (error: any) {
      console.error('خطأ في جلب السجلات:', error);
      res.status(500).json({
        error: 'فشل في جلب السجلات',
        details: error.message,
      });
    }
  }

  // جلب سجل واحد
  static async getLogById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const log = await PrintLogService.getLogById(parseInt(id));

      if (!log) {
        res.status(404).json({ error: 'السجل غير موجود' });
        return;
      }

      res.json(log);
    } catch (error: any) {
      console.error('خطأ في جلب السجل:', error);
      res.status(500).json({
        error: 'فشل في جلب السجل',
        details: error.message,
      });
    }
  }

  // السماح بإعادة الطباعة
  static async allowReprint(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountNumber, chequeNumbers } = req.body;

      if (!req.user?.isAdmin) {
        res.status(403).json({ error: 'هذه العملية تتطلب صلاحيات المدير' });
        return;
      }

      await PrintLogService.allowReprintForCheques(accountNumber, chequeNumbers);

      res.json({ message: 'تم السماح بإعادة الطباعة بنجاح' });
    } catch (error: any) {
      console.error('خطأ في السماح بإعادة الطباعة:', error);
      res.status(500).json({
        error: 'فشل في السماح بإعادة الطباعة',
        details: error.message,
      });
    }
  }
}
