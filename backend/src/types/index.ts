import { Request } from 'express';
import { Types } from 'mongoose';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email:  string;
  role:   'user' | 'company';
}

// Extends Express Request with our decoded JWT payload
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Vault ────────────────────────────────────────────────────────────────────

export type SectionKey =
  | 'personal_info'
  | 'professional_summary'
  | 'work_experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'achievements'
  | 'publications'
  | 'references'
  | 'legal_compliance'
  | 'resume_docs'
  | 'assessment_data'
  | 'application_metadata';

export const ALL_SECTION_KEYS: SectionKey[] = [
  'personal_info',
  'professional_summary',
  'work_experience',
  'education',
  'projects',
  'skills',
  'certifications',
  'achievements',
  'publications',
  'references',
  'legal_compliance',
  'resume_docs',
  'assessment_data',
  'application_metadata',
];

// Sections that hold exactly one entry (flat object, not a list)
export const SINGLETON_SECTIONS: SectionKey[] = [
  'personal_info',
  'professional_summary',
  'legal_compliance',
];

export interface SectionMeta {
  isComplete:   boolean;
  isPrivate:    boolean;
  completedAt:  Date | null;
  entryCount:   number;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success:  boolean;
  message:  string;
  data?:    T;
  errors?:  string[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?:  string;
  limit?: string;
}

export interface PaginatedResult<T> {
  items:      T[];
  total:      number;
  page:       number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}
