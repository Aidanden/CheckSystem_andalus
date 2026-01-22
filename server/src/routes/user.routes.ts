import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get current user info
router.get('/me', UserController.getMe);

// Get all permissions (for frontend dropdowns)
router.get('/permissions', UserController.getPermissions);

// Get all users (Admin only)
router.get('/', requireAdmin, UserController.getAll);

// Get user by id (Admin only)
router.get('/:id', requireAdmin, UserController.getById);

// Create user (Admin only)
router.post(
  '/',
  requireAdmin,
  validate([
    body('username').notEmpty().withMessage('Username is required'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('branch_id').optional().isInt().withMessage('Branch ID must be an integer'),
    body('is_admin').optional().isBoolean().withMessage('is_admin must be a boolean'),
    body('permission_ids').isArray().withMessage('permission_ids must be an array'),
  ]),
  UserController.create
);

// Update user (Admin only)
router.put(
  '/:id',
  requireAdmin,
  validate([
    body('username').optional().notEmpty().withMessage('Username cannot be empty'),
    body('password')
      .optional()
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('branch_id').optional().isInt().withMessage('Branch ID must be an integer'),
    body('is_admin').optional().isBoolean().withMessage('is_admin must be a boolean'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
    body('permission_ids').optional().isArray().withMessage('permission_ids must be an array'),
  ]),
  UserController.update
);

// Delete user (Admin only)
router.delete('/:id', requireAdmin, UserController.delete);

export default router;

