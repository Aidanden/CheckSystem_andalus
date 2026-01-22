import { Router } from 'express';
import { body } from 'express-validator';
import { PrintingController } from '../controllers/printing.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { PermissionCode } from '../types';

const router = Router();

// All printing routes require authentication
router.use(authenticate);

// Print checkbook (requires PRINTING permission)
router.post(
  '/print',
  requirePermission(PermissionCode.PRINTING),
  validate([
    body('account_number')
      .notEmpty()
      .withMessage('رقم الحساب مطلوب (Account number is required)')
      .isString()
      .withMessage('رقم الحساب يجب أن يكون نصاً (Account number must be a string)'),
    body('serial_from')
      .optional()
      .isInt({ min: 1 })
      .withMessage('الرقم التسلسلي من يجب أن يكون رقماً صحيحاً موجباً (Serial from must be a positive integer)'),
    body('serial_to')
      .optional()
      .isInt({ min: 1 })
      .withMessage('الرقم التسلسلي إلى يجب أن يكون رقماً صحيحاً موجباً (Serial to must be a positive integer)'),
  ]),
  PrintingController.printCheckbook
);

// Get print history
router.get(
  '/history',
  PrintingController.getPrintHistory
);

// Get statistics
router.get(
  '/statistics',
  PrintingController.getStatistics
);

// Download PDF (requires PRINTING permission)
router.get(
  '/download/:filename',
  requirePermission(PermissionCode.PRINTING),
  PrintingController.downloadPDF
);

export default router;

