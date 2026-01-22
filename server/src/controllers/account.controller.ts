import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AccountService } from '../services/account.service';
import { QueryAccountRequest } from '../types';

export class AccountController {
  static async getAll(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const accounts = await AccountService.getAllAccounts();
      res.json(accounts);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch accounts' });
      }
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const account = await AccountService.getAccountById(id);
      res.json(account);
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch account' });
      }
    }
  }

  static async queryAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { account_number, branch_id, branch_core_code, source } = req.body as QueryAccountRequest;
      const resolvedBranchId = branch_id ?? req.user?.branchId;
      const resolvedSource: 'test' | 'bank' = source ?? 'bank';

      const { account, checkbookDetails } = await AccountService.queryAccount(account_number, {
        source: resolvedSource,
        branchId: resolvedBranchId,
        branchCoreCode: branch_core_code,
      });

      if (req.user && !req.user.isAdmin) {
        if (account.branchId && req.user.branchId && account.branchId !== req.user.branchId) {
          res.status(403).json({ error: 'غير مسموح بالوصول لحساب تابع لفرع آخر' });
          return;
        }
      }

      res.json({ account, checkbookDetails });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to query account' });
      }
    }
  }
}

