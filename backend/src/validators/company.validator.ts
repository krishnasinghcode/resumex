import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import type { RequestedField, SectionKey } from '../types';
import { ALL_SECTION_KEYS } from '../types';

const VALID_DURATIONS    = [7, 30, 90];
const MAX_CUSTOM_DURATION = 180;

// ─── Company registration ─────────────────────────────────────────────────────

export const validateCompanyRegister = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { name, email, password } = req.body;

  if (!name?.trim() || name.trim().length < 2)
    errors.push('Company name must be at least 2 characters');

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('Valid email is required');

  if (!password || password.length < 8)
    errors.push('Password must be at least 8 characters');

  if (password && !/[A-Z]/.test(password))
    errors.push('Password must contain at least one uppercase letter');

  if (password && !/[0-9]/.test(password))
    errors.push('Password must contain at least one number');

  if (errors.length) { sendError(res, 'Validation failed', 422, errors); return; }
  next();
};

// ─── Company login ────────────────────────────────────────────────────────────

export const validateCompanyLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    sendError(res, 'Email and password are required', 400);
    return;
  }
  next();
};

// ─── RefID creation ───────────────────────────────────────────────────────────

export const validateCreateRefID = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { jobTitle, requestedFields, accessDuration } = req.body;

  if (!jobTitle?.trim() || jobTitle.trim().length < 2)
    errors.push('Job title must be at least 2 characters');

  if (!Array.isArray(requestedFields) || requestedFields.length === 0)
    errors.push('At least one section must be requested');

  if (Array.isArray(requestedFields)) {
    requestedFields.forEach((rf: RequestedField, i: number) => {
      if (!rf.section || !ALL_SECTION_KEYS.includes(rf.section as SectionKey))
        errors.push(`requestedFields[${i}].section is not a valid section key`);

      if (rf.fields !== undefined) {
        if (!Array.isArray(rf.fields) || rf.fields.some(f => typeof f !== 'string'))
          errors.push(`requestedFields[${i}].fields must be an array of strings`);
      }
    });
  }

  const duration = Number(accessDuration);
  if (isNaN(duration) || duration < 1) {
    errors.push('Access duration must be a positive number of days');
  } else if (!VALID_DURATIONS.includes(duration) && duration > MAX_CUSTOM_DURATION) {
    errors.push(`Custom access duration cannot exceed ${MAX_CUSTOM_DURATION} days`);
  }

  if (errors.length) { sendError(res, 'Validation failed', 422, errors); return; }
  next();
};
