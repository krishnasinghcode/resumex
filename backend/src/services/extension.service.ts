import { Types } from 'mongoose';
import { VaultSectionModel } from '../models/VaultSection';
import { ALL_SECTION_KEYS, SINGLETON_SECTIONS, SectionKey } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormField {
  id: string;
  name: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}

export interface FieldMatch {
  fieldId: string;
  fieldName: string;
  matchedKey: string;
  matchedValue: any;
  confidence: number;
  section: SectionKey;
}

export interface SearchResult {
  section: string;
  fieldName: string;
  value: any;
  path: string; // e.g. "personal.email"
}

// ─── Field Patterns ───────────────────────────────────────────────────────────

const FIELD_PATTERNS: Record<string, string[]> = {
  'personal.firstName': ['first name', 'firstname', 'fname', 'given name', 'forename'],
  'personal.lastName': ['last name', 'lastname', 'lname', 'surname', 'family name'],
  'personal.fullName': ['full name', 'fullname', 'name', 'your name', 'applicant name'],
  'personal.email': ['email', 'e-mail', 'email address', 'mail', 'contact email'],
  'personal.phone': ['phone', 'mobile', 'telephone', 'contact number', 'phone number', 'cell'],
  'personal.dateOfBirth': ['date of birth', 'dob', 'birthday', 'birth date', 'birthdate'],
  'personal.address.street': ['street', 'address line 1', 'street address', 'address'],
  'personal.address.city': ['city', 'town'],
  'personal.address.state': ['state', 'province', 'region'],
  'personal.address.zip': ['zip', 'zipcode', 'postal code', 'postcode', 'pin code'],
  'personal.address.country': ['country', 'nation'],
  'personal.linkedIn': ['linkedin', 'linkedin profile', 'linkedin url'],
  'personal.github': ['github', 'github profile', 'github username', 'github url'],
  'personal.portfolio': ['portfolio', 'portfolio url', 'website', 'personal website'],

  'professional.headline': ['headline', 'professional headline', 'title', 'tagline'],
  'professional.bio': ['bio', 'summary', 'about', 'professional summary', 'profile'],
  'professional.yearsOfExperience': ['years of experience', 'experience years', 'total experience'],
  'professional.currentRole': ['current role', 'current position', 'current job', 'job title'],

  'work.company': ['company', 'current company', 'employer', 'organization', 'company name'],
  'work.title': ['job title', 'position', 'role', 'current title'],
  'work.startDate': ['start date', 'joined date', 'from date', 'employment start'],
  'work.endDate': ['end date', 'to date', 'employment end'],

  'education.institution': ['university', 'college', 'school', 'institution', 'educational institution'],
  'education.degree': ['degree', 'qualification', 'education level'],
  'education.field': ['field of study', 'major', 'specialization', 'discipline', 'course'],
  'education.gpa': ['gpa', 'grade point average', 'cgpa', 'marks', 'percentage'],

  'skills': ['skills', 'technical skills', 'core skills', 'key skills', 'competencies'],

  'legal.workAuthorization': ['work authorization', 'authorization', 'visa status', 'work permit'],
  'legal.requiresSponsorship': ['require sponsorship', 'need sponsorship', 'visa sponsorship'],
  'legal.willingToRelocate': ['willing to relocate', 'open to relocation', 'relocation'],
};

// ─── Matching Helpers ─────────────────────────────────────────────────────────

function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeFieldName(str1);
  const s2 = normalizeFieldName(str2);

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

function findBestMatch(fieldName: string, fieldType: string): { key: string; confidence: number } | null {
  let bestMatch: { key: string; confidence: number } | null = null;

  for (const [vaultKey, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      const confidence = calculateSimilarity(fieldName, pattern);

      let adjustedConfidence = confidence;
      if (fieldType === 'email' && vaultKey.includes('email')) adjustedConfidence += 0.1;
      if (fieldType === 'tel' && vaultKey.includes('phone')) adjustedConfidence += 0.1;
      if (fieldType === 'date' && vaultKey.includes('Date')) adjustedConfidence += 0.1;

      if (adjustedConfidence > (bestMatch?.confidence || 0.6)) {
        bestMatch = { key: vaultKey, confidence: Math.min(adjustedConfidence, 1.0) };
      }
    }
  }

  return bestMatch;
}

// ─── Main Service Functions ──────────────────────────────────────────────────

export async function matchFormFields(
  userId: string,
  fields: FormField[]
): Promise<FieldMatch[]> {
  const autofillData = await getAutofillData(userId);
  const matches: FieldMatch[] = [];

  for (const field of fields) {
    const match = findBestMatch(field.name, field.type);

    if (match && match.confidence > 0.6) {
      const value = getNestedValue(autofillData, match.key);

      if (value !== undefined && value !== null) {
        matches.push({
          fieldId: field.id,
          fieldName: field.name,
          matchedKey: match.key,
          matchedValue: value,
          confidence: match.confidence,
          section: getSectionKey(match.key),
        });
      }
    }
  }

  return matches;
}

export async function getAutofillData(userId: string): Promise<Record<string, any>> {
  const userIdObj = new Types.ObjectId(userId);

  const sections = await VaultSectionModel.find({
    userId: userIdObj,
    isPrivate: false,
  });

  const data: Record<string, any> = {};

  for (const section of sections) {
    const publicEntries = section.entries.filter((entry: any) => !entry.isPrivate);

    if (publicEntries.length === 0) continue;

    if (SINGLETON_SECTIONS.includes(section.sectionKey as SectionKey)) {
      const entry = publicEntries[0];
      if (entry) {
        data[section.sectionKey] = flattenEntry(entry);
      }
    } else {
      if (section.sectionKey === 'work_experience') {
        const current = publicEntries.find((e: any) => e.isCurrent);
        const latest = current || publicEntries.sort((a: any, b: any) => 
          new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
        )[0];

        if (latest) {
          data.work = flattenEntry(latest);
        }
      }

      if (section.sectionKey === 'education') {
        const current = publicEntries.find((e: any) => e.isCurrent);
        const latest = current || publicEntries.sort((a: any, b: any) => 
          new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
        )[0];

        if (latest) {
          data.education = flattenEntry(latest);
        }
      }

      if (section.sectionKey === 'skills') {
        data.skills = publicEntries.map((e: any) => e.name);
      }
    }
  }

  if (data.personal_info) {
    data.personal = data.personal_info;
    delete data.personal_info;
  }

  if (data.professional_summary) {
    data.professional = data.professional_summary;
    delete data.professional_summary;
  }

  if (data.legal_compliance) {
    data.legal = data.legal_compliance;
    delete data.legal_compliance;
  }

  return data;
}

// ─── NEW: Search Vault ────────────────────────────────────────────────────────

export async function searchVault(userId: string, query: string): Promise<SearchResult[]> {
  const userIdObj = new Types.ObjectId(userId);
  const normalizedQuery = normalizeFieldName(query);
  const results: SearchResult[] = [];

  const sections = await VaultSectionModel.find({
    userId: userIdObj,
    isPrivate: false,
  });

  for (const section of sections) {
    const publicEntries = section.entries.filter((entry: any) => !entry.isPrivate);

    for (const entry of publicEntries) {
      const flattened = flattenEntry(entry);

      for (const [key, value] of Object.entries(flattened)) {
        if (!value) continue;

        const normalizedKey = normalizeFieldName(key);
        const normalizedValue = normalizeFieldName(String(value));

        // Match if query appears in field name OR value
        if (normalizedKey.includes(normalizedQuery) || normalizedValue.includes(normalizedQuery)) {
          results.push({
            section: formatSectionName(section.sectionKey),
            fieldName: formatFieldName(key),
            value: value,
            path: `${section.sectionKey}.${key}`,
          });
        }
      }
    }
  }

  return results;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function flattenEntry(entry: any): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const [key, value] of Object.entries(entry)) {
    if (key === '_id' || key === 'isPrivate') continue;

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        flattened[`${key}.${nestedKey}`] = nestedValue;
      }
    } else {
      flattened[key] = value;
    }
  }

  return flattened;
}

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }

  return current;
}

function getSectionKey(vaultKey: string): SectionKey {
  const prefix = vaultKey.split('.')[0];

  const mapping: Record<string, SectionKey> = {
    personal: 'personal_info',
    professional: 'professional_summary',
    work: 'work_experience',
    education: 'education',
    skills: 'skills',
    legal: 'legal_compliance',
  };

  return mapping[prefix] || 'personal_info';
}

function formatSectionName(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatFieldName(key: string): string {
  return key
    .split('.')
    .pop()!
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
