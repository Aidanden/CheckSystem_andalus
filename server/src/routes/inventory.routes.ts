import { Router } from 'express';
import { body } from 'express-validator';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { PermissionCode } from '../types';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// Get all inventory (requires INVENTORY_MANAGEMENT or CERTIFIED_INVENTORY_MANAGEMENT permission)
router.get(
  '/',
  requirePermission([PermissionCode.INVENTORY_MANAGEMENT, PermissionCode.CERTIFIED_INVENTORY_MANAGEMENT]),
  InventoryController.getAll
);

// Get inventory by stock type
router.get(
  '/:stockType',
  requirePermission([PermissionCode.INVENTORY_MANAGEMENT, PermissionCode.CERTIFIED_INVENTORY_MANAGEMENT]),
  InventoryController.getByStockType
);

// Add stock (requires INVENTORY_MANAGEMENT or CERTIFIED_INVENTORY_MANAGEMENT permission)
router.post(
  '/add',
  requirePermission([PermissionCode.INVENTORY_MANAGEMENT, PermissionCode.CERTIFIED_INVENTORY_MANAGEMENT]),
  validate([
    body('stock_type').isInt({ min: 1, max: 3 }).withMessage('Stock type must be 1, 2, or 3'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive'),
    body('serial_from').optional().isString().withMessage('Serial from must be a string'),
    body('serial_to').optional().isString().withMessage('Serial to must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ]),
  InventoryController.addStock
);

// Get transaction history
router.get(
  '/transactions/history',
  requirePermission([PermissionCode.REPORTING, PermissionCode.INVENTORY_MANAGEMENT, PermissionCode.CERTIFIED_INVENTORY_MANAGEMENT]),
  InventoryController.getTransactionHistory
);

export default router;

