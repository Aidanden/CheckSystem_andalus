import { Router } from 'express';
import { PrintSettingsController } from '../controllers/printSettings.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Get settings for specific account type (authenticated users)
router.get(
  '/:accountType',
  authenticate,
  PrintSettingsController.getSettings
);

// Save settings (admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  PrintSettingsController.saveSettings
);

export default router;

