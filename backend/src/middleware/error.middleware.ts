import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';

// Wraps async controllers — no try/catch needed in every handler
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Global error handler — registered last in app.ts
export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Operational errors (AppError) — send clean message to client
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    sendError(res, 'Validation failed', 422, errors);
    return;
  }

  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    sendError(res, `${field} already exists`, 409);
    return;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    sendError(res, 'Invalid ID format', 400);
    return;
  }

  // JWT errors (shouldn't reach here if middleware is correct, but safety net)
  if (err.name === 'JsonWebTokenError')  { sendError(res, 'Invalid token', 401);  return; }
  if (err.name === 'TokenExpiredError')  { sendError(res, 'Token expired', 401);  return; }

  // Unexpected errors — log full error, send generic message in prod
  console.error('💥 Unexpected error:', err);

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message || 'Something went wrong';

  sendError(res, message, 500);
};
