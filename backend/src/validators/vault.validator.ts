import { Request, Response, NextFunction } from '../src/node_modules/@types/express';
import { sendError } from '../utils/response';
import { ALL_SECTION_KEYS, SectionKey } from '../types';

// ─── Section key validator (used as route middleware) ─────────────────────────

export const validateSectionKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { sectionKey } = req.params;

  if (!ALL_SECTION_KEYS.includes(sectionKey as SectionKey)) {
    sendError(
      res,
      `Invalid sectionKey "${sectionKey}". Valid keys: ${ALL_SECTION_KEYS.join(', ')}`,
      400
    );
    return;
  }

  next();
};

// ─── Per-section entry validators ─────────────────────────────────────────────
// Validates required fields for each section type before hitting the service.

type SectionValidator = (body: any) => string[];

const validators: Partial<Record<SectionKey, SectionValidator>> = {
  personal_info: (body) => {
    const errors: string[] = [];
    if (!body.firstName?.trim()) errors.push('firstName is required');
    if (!body.lastName?.trim()) errors.push('lastName is required');
    if (!body.email?.trim()) errors.push('email is required');
    return errors;
  },

  professional_summary: (body) => {
    const errors: string[] = [];
    if (!body.headline?.trim()) errors.push('headline is required');
    return errors;
  },

  work_experience: (body) => {
    const errors: string[] = [];
    if (!body.company?.trim()) errors.push('company is required');
    if (!body.title?.trim()) errors.push('title is required');
    if (!body.startDate) errors.push('startDate is required');
    if (!body.isCurrent && !body.endDate) {
      errors.push('endDate is required when isCurrent is false');
    }
    return errors;
  },

  education: (body) => {
    const errors: string[] = [];
    if (!body.institution?.trim()) errors.push('institution is required');
    return errors;
  },

  projects: (body) => {
    const errors: string[] = [];
    if (!body.name?.trim()) errors.push('project name is required');
    return errors;
  },

  skills: (body) => {
    const errors: string[] = [];
    if (!body.name?.trim()) errors.push('skill name is required');
    if (
      body.proficiency &&
      !['beginner', 'intermediate', 'advanced', 'expert'].includes(body.proficiency)
    ) {
      errors.push('proficiency must be: beginner, intermediate, advanced, or expert');
    }
    return errors;
  },

  certifications: (body) => {
    const errors: string[] = [];
    if (!body.name?.trim()) errors.push('certification name is required');
    return errors;
  },

  achievements: (body) => {
    const errors: string[] = [];
    if (!body.title?.trim()) errors.push('achievement title is required');
    return errors;
  },

  publications: (body) => {
    const errors: string[] = [];
    if (!body.title?.trim()) errors.push('publication title is required');
    return errors;
  },

  references: (body) => {
    const errors: string[] = [];
    if (!body.name?.trim()) errors.push('reference name is required');
    return errors;
  },

  legal_compliance: (_body) => [],  // All fields optional

  resume_docs: (body) => {
    const errors: string[] = [];
    if (!body.fileName?.trim()) errors.push('fileName is required');
    if (!body.fileUrl?.trim()) errors.push('fileUrl is required');
    return errors;
  },

  assessment_data: (body) => {
    const errors: string[] = [];
    if (!body.type?.trim()) errors.push('assessment type is required');
    return errors;
  },

  application_metadata: (body) => {
    const errors: string[] = [];
    if (!body.company?.trim()) errors.push('company is required');
    return errors;
  },
};

// ─── Middleware that runs the right validator for the current sectionKey ───────

export const validateEntryBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sectionKey = req.params.sectionKey as SectionKey;
  const validator = validators[sectionKey];

  if (!validator) {
    next();
    return;
  }

  const errors = validator(req.body);

  if (errors.length > 0) {
    sendError(res, 'Entry validation failed', 422, errors);
    return;
  }

  next();
};

// ─── Privacy toggle validator ─────────────────────────────────────────────────

export const validatePrivacyToggle = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { isPrivate } = req.body;

  if (typeof isPrivate !== 'boolean') {
    sendError(res, 'isPrivate must be a boolean (true or false)', 400);
    return;
  }

  next();
};

// ─── Search query validator ───────────────────────────────────────────────────

export const validateSearchQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    sendError(res, 'Search query "q" is required', 400);
    return;
  }

  if (q.trim().length < 2) {
    sendError(res, 'Search query must be at least 2 characters', 400);
    return;
  }

  next();
};
