import { Router } from 'express';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import userRoutes from './user.routes';
import inventoryRoutes from './inventory.routes';
import accountRoutes from './account.routes';
import printingRoutes from './printing.routes';
import printSettingsRoutes from './printSettings.routes';
import systemSettingsRoutes from './systemSettings.routes';
import soapRoutes from './soap.routes';
import printLogRoutes from './printLog.routes';
import certifiedCheckRoutes from './certifiedCheck.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Check Printing System API is running' });
});

// API routes
router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/users', userRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/accounts', accountRoutes);
router.use('/printing', printingRoutes);
router.use('/print-settings', printSettingsRoutes);
router.use('/system-settings', systemSettingsRoutes);
router.use('/soap', soapRoutes);
router.use('/print-logs', printLogRoutes);
router.use('/certified-checks', certifiedCheckRoutes);

export default router;

