import { Request } from 'express';
import { Types } from 'mongoose';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email:  string;
  role:   'user' | 'company';
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Company-specific request — populated by protectCompany middleware
export interface CompanyRequest extends Request {
  company?: JwtPayload;
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

export const SINGLETON_SECTIONS: SectionKey[] = [
  'personal_info',
  'professional_summary',
  'legal_compliance',
];

export interface SectionMeta {
  isComplete:  boolean;
  isPrivate:   boolean;
  completedAt: Date | null;
  entryCount:  number;
}

// ─── RefID ────────────────────────────────────────────────────────────────────

// A single requested field — either a whole section or specific fields within it
export interface RequestedField {
  section: SectionKey;
  fields?: string[]; // if absent, entire section is requested
}

// ─── Permission ───────────────────────────────────────────────────────────────

export interface PermissionDoc {
  _id:            Types.ObjectId;
  userId:         Types.ObjectId;
  companyId:      Types.ObjectId;
  refId:          Types.ObjectId;
  refIdCode:      string;
  grantedFields:  RequestedField[];
  scopedToken:    string;   // bcrypt hash — never returned raw
  expiresAt:      Date;
  grantedAt:      Date;
  isRevoked:      boolean;
}

// ─── Access Log ───────────────────────────────────────────────────────────────

export interface AccessLogDoc {
  _id:             Types.ObjectId;
  companyId:       Types.ObjectId;
  userId:          Types.ObjectId;
  permissionId:    Types.ObjectId;
  refIdCode:       string;
  fieldsAccessed:  RequestedField[];
  ip:              string;
  userAgent:       string;
  accessedAt:      Date;
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
