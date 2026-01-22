import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../types';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials: LoginRequest = req.body;
      const result = await AuthService.login(credentials);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Login failed' });
      }
    }
  }
}

