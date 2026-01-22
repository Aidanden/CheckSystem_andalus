import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrintingService } from '../services/printing.service';
import { AccountService } from '../services/account.service';
import { PrintCheckbookRequest } from '../types';

export class PrintingController {
  static async printCheckbook(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { account_number, serial_from, serial_to } = req.body as PrintCheckbookRequest;

      if (!account_number) {
        res.status(400).json({
          success: false,
          error: 'Account number is required'
        });
        return;
      }

      // Fetch account to enforce branch-level access before printing
      const account = await AccountService.getAccountByNumber(account_number);
      if (!account) {
        res.status(404).json({ success: false, error: 'Account not found' });
        return;
      }

      // Enforce branch-level access: non-admin users cannot print accounts of other branches
      if (req.user && !req.user.isAdmin) {
        if (account.branchId && req.user.branchId && account.branchId !== req.user.branchId) {
          res.status(403).json({ success: false, error: 'غير مسموح بالوصول لحساب تابع لفرع آخر' });
          return;
        }
      }

      // Get branchId from user, or find first available branch
      let branchId = req.user.branchId;
      if (!branchId) {
        // Import BranchModel to get first branch
        const { BranchModel } = await import('../models/Branch.model');
        const branches = await BranchModel.findAll();
        if (branches.length === 0) {
          res.status(400).json({
            success: false,
            error: 'No branches available in the system'
          });
          return;
        }
        branchId = branches[0].id;
      }

      const result = await PrintingService.printCheckbook(
        account_number,
        req.user.userId,
        branchId,
        serial_from,
        serial_to
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('❌ خطأ في طباعة الشيك:', error);
      if (error instanceof Error) {
        console.error('   التفاصيل:', error.message);
        console.error('   Stack:', error.stack);
        res.status(400).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to print checkbook',
        });
      }
    }
  }

  static async getPrintHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Parse query parameters
      const userId = req.query.user_id
        ? parseInt(req.query.user_id as string)
        : undefined;
      const accountNumber = req.query.account_number as string | undefined;
      const accountHolderName = req.query.account_holder_name as string | undefined;
      const accountType = req.query.account_type ? parseInt(req.query.account_type as string) : undefined;
      const status = req.query.status as string | undefined;
      const dateFrom = req.query.date_from as string | undefined;
      const dateTo = req.query.date_to as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : 100;

      // Branch filtering with permissions
      let branchId: number | undefined;

      if (req.user.isAdmin) {
        // Admin can filter by any branch or see all
        branchId = req.query.branch_id
          ? parseInt(req.query.branch_id as string)
          : undefined;
      } else {
        // Non-admin users can only see their own branch
        if (!req.user.branchId) {
          res.status(403).json({ error: 'المستخدم غير مرتبط بفرع' });
          return;
        }
        branchId = req.user.branchId;
      }

      const history = await PrintingService.getPrintHistory({
        userId,
        branchId,
        accountNumber,
        accountHolderName,
        accountType,
        status,
        dateFrom,
        dateTo,
        limit,
      });

      res.json(history);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch print history' });
      }
    }
  }

  static async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      let branchId: number | undefined;

      if (req.user.isAdmin) {
        // Admin can filter by any branch or see all
        branchId = req.query.branch_id
          ? parseInt(req.query.branch_id as string)
          : undefined;
      } else {
        // Non-admin users can only see their own branch
        if (!req.user.branchId) {
          res.status(403).json({ error: 'المستخدم غير مرتبط بفرع' });
          return;
        }
        branchId = req.user.branchId;
      }

      const stats = await PrintingService.getPrintStatistics(branchId);
      res.json(stats);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch statistics' });
      }
    }
  }

  static async downloadPDF(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const path = require('path');
      const fs = require('fs');

      // Validate filename to prevent directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        res.status(400).json({ error: 'Invalid filename' });
        return;
      }

      const filepath = path.join(process.cwd(), 'output', 'checkbooks', filename);

      // Check if file exists
      if (!fs.existsSync(filepath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // Stream file with inline disposition so browsers render PDF instead of forcing download
      const stat = fs.statSync(filepath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      const stream = fs.createReadStream(filepath);
      stream.on('error', (err: any) => {
        console.error('Error streaming file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream file' });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error('Error in downloadPDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process download request' });
      }
    }
  }
}

