import { Router } from 'express';
import {
    getBranches,
    getNextSerialRange,
    printBook,
    reprintBook,
    getLogs,
    getStatistics,
    getSettings,
    updateSettings,
    savePrintRecord,
    updatePrintRecord,
    getPrintRecords,
    getRecordStatistics,
} from '../controllers/certifiedCheck.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get branches for certified check printing
router.get('/branches', getBranches); // Common access

// Get next serial range for a branch
router.get('/serial/:branchId', requirePermission('SCREEN_CERTIFIED_BOOKS'), getNextSerialRange);

// Print a new certified check book
router.post('/print', requirePermission('SCREEN_CERTIFIED_BOOKS'), printBook);

// Reprint a certified check book
router.post('/reprint/:logId', requirePermission('REPRINT_CERTIFIED'), reprintBook);

// Get print logs
router.get('/logs', requirePermission('SCREEN_CERTIFIED_LOGS'), getLogs);

// Get statistics
router.get('/statistics', requirePermission('SCREEN_CERTIFIED_BOOKS'), getStatistics);

// Get print settings
router.get('/settings', requirePermission('SYSTEM_SETTINGS'), getSettings);

// Update print settings
router.put('/settings', requirePermission('SYSTEM_SETTINGS'), updateSettings);

// Save individual certified check print record
router.post('/print-record', requirePermission('SCREEN_CERTIFIED_PRINT'), savePrintRecord);

// Update individual certified check print record
router.put('/print-record/:id', requirePermission('SCREEN_CERTIFIED_PRINT'), updatePrintRecord);

// Get individual certified check print records
router.get('/print-records', requirePermission(['SCREEN_CERTIFIED_PRINT', 'SCREEN_CERTIFIED_REPORTS']), getPrintRecords);

// Get individual certified check statistics
router.get('/record-statistics', requirePermission(['SCREEN_CERTIFIED_PRINT', 'SCREEN_CERTIFIED_REPORTS']), getRecordStatistics);

export default router;
