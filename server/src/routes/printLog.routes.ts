import { Router } from 'express';
import { body, query } from 'express-validator';
import { PrintLogController } from '../controllers/printLog.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// جميع المسارات تتطلب المصادقة
router.use(authenticate);

// إنشاء سجل طباعة جديد
router.post(
  '/',
  validate([
    body('accountNumber').isString().notEmpty(),
    body('accountBranch').isString().notEmpty(),
    body('firstChequeNumber').isInt(),
    body('lastChequeNumber').isInt(),
    body('totalCheques').isInt(),
    body('accountType').isInt(),
    body('operationType').isIn(['print', 'reprint']),
    body('reprintReason').optional().isIn(['damaged', 'not_printed']),
    body('chequeNumbers').isArray(),
  ]),
  PrintLogController.createLog
);

// التحقق من حالة طباعة الشيكات
router.post(
  '/check-status',
  validate([
    body('accountNumber').isString().notEmpty(),
    body('chequeNumbers').isArray(),
  ]),
  PrintLogController.checkPrintStatus
);

// جلب جميع السجلات
router.get(
  '/',
  validate([
    query('page').optional().isInt(),
    query('limit').optional().isInt(),
    query('operationType').optional().isIn(['print', 'reprint']),
    query('accountNumber').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('userId').optional().isInt(),
  ]),
  PrintLogController.getAllLogs
);

// جلب سجل واحد
router.get('/:id', PrintLogController.getLogById);

// السماح بإعادة الطباعة (Admin فقط)
router.post(
  '/allow-reprint',
  validate([
    body('accountNumber').isString().notEmpty(),
    body('chequeNumbers').isArray(),
  ]),
  PrintLogController.allowReprint
);

export default router;
