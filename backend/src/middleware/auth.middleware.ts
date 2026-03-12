import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No token provided', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Access token expired', 401);
      return;
    }
    sendError(res, 'Invalid token', 401);
  }
};

// Role guard — use after protect
export const requireRole = (role: 'user' | 'company') =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }
    next();
  };
