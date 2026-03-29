import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import type { CompanyRequest } from '../types';

// Mirrors the user protect() middleware but for company routes.
// Attaches decoded payload to req.company instead of req.user
// so the two auth contexts never get mixed up.
export const protectCompany = (req: CompanyRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'No token provided', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    sendError(res, 'Invalid authorization header', 401);
    return;
  }

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.role !== 'company') {
      sendError(res, 'Access denied — company account required', 403);
      return;
    }

    req.company = decoded;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};