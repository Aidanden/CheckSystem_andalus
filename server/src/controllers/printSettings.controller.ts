import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrintSettingsService } from '../services/printSettings.service';

export class PrintSettingsController {
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const accountType = parseInt(req.params.accountType);
      
      if (![1, 2, 3, 4].includes(accountType)) {
        res.status(400).json({ error: 'Invalid account type' });
        return;
      }

      const settings = await PrintSettingsService.getSettings(accountType);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching print settings:', error);
      res.status(500).json({ error: 'Failed to fetch print settings' });
    }
  }

  static async saveSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const data = req.body;
      
      // Validate account type
      if (![1, 2, 3, 4].includes(data.accountType)) {
        res.status(400).json({ error: 'Invalid account type' });
        return;
      }

      const settings = await PrintSettingsService.saveSettings(data);
      res.json({ 
        success: true, 
        message: 'Settings saved successfully',
        settings 
      });
    } catch (error) {
      console.error('Error saving print settings:', error);
      res.status(500).json({ error: 'Failed to save print settings' });
    }
  }
}

