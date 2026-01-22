import { Router } from 'express';
import { body } from 'express-validator';
import { SoapController } from '../controllers/soap.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All SOAP routes require authentication
router.use(authenticate);

// Query checkbook via SOAP
router.post(
  '/query-checkbook',
  validate([
    body('accountNumber')
      .isString()
      .withMessage('رقم الحساب يجب أن يكون نصاً')
      .trim()
      .isLength({ min: 1 })
      .withMessage('رقم الحساب مطلوب'),
    body('branchCode')
      .optional()
      .isString()
      .withMessage('رمز الفرع يجب أن يكون نصاً'),
    body('firstChequeNumber')
      .optional()
      .isInt({ min: 0 })
      .withMessage('رقم الشيك الأول يجب أن يكون رقماً صحيحاً'),
  ]),
  SoapController.queryCheckbook
);

export default router;
