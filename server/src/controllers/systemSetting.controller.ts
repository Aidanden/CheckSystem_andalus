import { AuthRequest } from '../middleware/auth.middleware';
import { Response } from 'express';
import { SystemSettingService } from '../services/systemSetting.service';

export class SystemSettingController {
  static async getSoapEndpoint(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const endpoint = await SystemSettingService.getSoapEndpoint();
      res.json({ endpoint });
    } catch (error) {
      console.error('Error fetching SOAP endpoint:', error);
      res.status(500).json({ error: 'فشل في تحميل رابط SOAP الحالي' });
    }
  }

  static async updateSoapEndpoint(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'صلاحيات المشرف مطلوبة لتعديل رابط SOAP' });
      return;
    }

    try {
      const { endpoint } = req.body as { endpoint?: string };
      if (!endpoint || typeof endpoint !== 'string' || !endpoint.trim()) {
        res.status(400).json({ error: 'رابط SOAP مطلوب' });
        return;
      }

      const saved = await SystemSettingService.updateSoapEndpoint(endpoint);
      res.json({ success: true, endpoint: saved.value });
    } catch (error) {
      console.error('Error updating SOAP endpoint:', error);
      res.status(500).json({ error: 'فشل في تحديث رابط SOAP' });
    }
  }

  static async getSoapIAEndpoint(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const endpoint = await SystemSettingService.getSoapIAEndpoint();
      res.json({ endpoint });
    } catch (error) {
      console.error('Error fetching SOAP IA endpoint:', error);
      res.status(500).json({ error: 'فشل في تحميل رابط SOAP IA الحالي' });
    }
  }

  static async updateSoapIAEndpoint(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'صلاحيات المشرف مطلوبة لتعديل رابط SOAP IA' });
      return;
    }

    try {
      const { endpoint } = req.body as { endpoint?: string };
      if (!endpoint || typeof endpoint !== 'string' || !endpoint.trim()) {
        res.status(400).json({ error: 'رابط SOAP IA مطلوب' });
        return;
      }

      const saved = await SystemSettingService.updateSoapIAEndpoint(endpoint);
      res.json({ success: true, endpoint: saved.value });
    } catch (error) {
      console.error('Error updating SOAP IA endpoint:', error);
      res.status(500).json({ error: 'فشل في تحديث رابط SOAP IA' });
    }
  }
}
