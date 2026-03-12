import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

// ─── Simple validator ─────────────────────────────────────────────────────────
// We do this manually (no Zod/Joi) to keep deps lean for MVP.
// You can swap this out for Zod later without touching controllers.

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Field validators ─────────────────────────────────────────────────────────

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isNonEmpty = (val: any): boolean =>
  val !== undefined && val !== null && String(val).trim().length > 0;

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password, displayName } = req.body;
  const errors: string[] = [];

  if (!isNonEmpty(email)) errors.push('email is required');
  else if (!isValidEmail(email)) errors.push('email is invalid');

  if (!isNonEmpty(password)) errors.push('password is required');
  else if (password.length < 8) errors.push('password must be at least 8 characters');
  else if (!/[A-Z]/.test(password)) errors.push('password must contain at least one uppercase letter');
  else if (!/[0-9]/.test(password)) errors.push('password must contain at least one number');

  if (!isNonEmpty(displayName)) errors.push('displayName is required');
  else if (displayName.trim().length < 2) errors.push('displayName must be at least 2 characters');

  if (errors.length > 0) {
    sendError(res, 'Validation failed', 422, errors);
    return;
  }

  next();
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;
  const errors: string[] = [];

  if (!isNonEmpty(email)) errors.push('email is required');
  if (!isNonEmpty(password)) errors.push('password is required');

  if (errors.length > 0) {
    sendError(res, 'Validation failed', 422, errors);
    return;
  }

  next();
};

// ─── Reusable field presence checker ─────────────────────────────────────────

export const requireFields = (fields: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const field of fields) {
      if (!isNonEmpty(req.body[field])) {
        errors.push(`${field} is required`);
      }
    }

    if (errors.length > 0) {
      sendError(res, 'Validation failed', 422, errors);
      return;
    }

    next();
  };
