import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    isAdmin: boolean;
    branchId?: number;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = await AuthService.verifyToken(token);

    // Verify user still exists and is active
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid token or user is disabled' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      isAdmin: decoded.isAdmin,
      branchId: decoded.branchId,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export const requirePermission = (permissionCode: string | string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Admins have all permissions
      if (req.user.isAdmin) {
        next();
        return;
      }

      const codes = Array.isArray(permissionCode) ? permissionCode : [permissionCode];

      // Check if user has ANY of the required permissions
      let hasPermission = false;
      for (const code of codes) {
        if (await UserModel.hasPermission(req.user.userId, code)) {
          hasPermission = true;
          break;
        }
      }

      if (!hasPermission) {
        res.status(403).json({
          error: 'You do not have permission to perform this action',
          required_permission: permissionCode,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

