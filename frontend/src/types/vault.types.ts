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
  'personal_info', 'professional_summary', 'work_experience',
  'education', 'projects', 'skills', 'certifications',
  'achievements', 'publications', 'references', 'legal_compliance',
  'resume_docs', 'assessment_data', 'application_metadata',
];

export const SINGLETON_SECTIONS: SectionKey[] = [
  'personal_info', 'professional_summary', 'legal_compliance',
];

export interface SectionMeta {
  isComplete:  boolean;
  isPrivate:   boolean;
  entryCount:  number;
  completedAt: string | null;
}

export interface VaultMeta {
  userId:   string;
  sections: Record<SectionKey, SectionMeta>;
}

export interface VaultEntry {
  _id:       string;
  isPrivate: boolean;
  [key: string]: unknown;
}

export interface VaultSection {
  _id:        string;
  userId:     string;
  sectionKey: SectionKey;
  isPrivate:  boolean;
  entries:    VaultEntry[];
  createdAt:  string;
  updatedAt:  string;
}

export interface SearchHit {
  sectionKey:    SectionKey;
  entryId:       string;
  matchedFields: { field: string; value: string }[];
  isPrivate:     boolean;
  entryIsPrivate: boolean;
}

export interface SearchResult {
  query:   string;
  count:   number;
  results: SearchHit[];
}
