import { Router } from 'express';
import { body } from 'express-validator';
import { BranchController } from '../controllers/branch.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All branch routes require authentication
router.use(authenticate);

// Get all branches
router.get('/', BranchController.getAll);

// Get branch by core code (branch number or routing suffix)
router.get('/code/:code', BranchController.getByCode);

// Get branch by account number (extracts first 3 digits)
router.get('/account/:accountNumber', BranchController.getByAccountNumber);

// Get branch by id
router.get('/:id', BranchController.getById);

// Create branch (Admin only)
router.post(
  '/',
  requireAdmin,
  validate([
    body('branch_name').notEmpty().withMessage('Branch name is required'),
    body('branch_location').notEmpty().withMessage('Branch location is required'),
    body('routing_number').notEmpty().withMessage('Routing number is required'),
  ]),
  BranchController.create
);

// Update branch (Admin only)
router.put(
  '/:id',
  requireAdmin,
  validate([
    body('branch_name').optional().notEmpty().withMessage('Branch name cannot be empty'),
    body('branch_location').optional().notEmpty().withMessage('Branch location cannot be empty'),
    body('routing_number').optional().notEmpty().withMessage('Routing number cannot be empty'),
  ]),
  BranchController.update
);

// Delete branch (Admin only)
router.delete('/:id', requireAdmin, BranchController.delete);

export default router;

