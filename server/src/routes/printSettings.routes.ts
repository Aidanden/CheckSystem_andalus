import { Router } from 'express';
import { PrintSettingsController } from '../controllers/printSettings.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Get settings for specific account type (authenticated users)
router.get(
  '/:accountType',
  authenticate,
  PrintSettingsController.getSettings
);

// Save settings — admins or users with SYSTEM_SETTINGS
router.post(
  '/',
  authenticate,
  requirePermission('SYSTEM_SETTINGS'),
  PrintSettingsController.saveSettings
);

export default router;
