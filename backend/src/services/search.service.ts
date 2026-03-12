import { VaultSectionModel } from '../models/VaultSection';
import { SectionKey } from '../types';

export interface SearchHit {
  sectionKey: SectionKey;
  entryId: string;
  matchedFields: { field: string; value: string }[];
  isPrivate: boolean;
  entryIsPrivate: boolean;
}

/**
 * Searches all vault sections for a given query string.
 * Does case-insensitive substring matching across all string fields.
 *
 * For production scale, swap this with a MongoDB $text index or Elasticsearch.
 * For MVP this is completely fine.
 */
export const searchVault = async (
  userId: string,
  query: string,
  includePrivate = true
): Promise<SearchHit[]> => {
  const sections = await VaultSectionModel.find({ userId });
  const hits: SearchHit[] = [];
  const q = query.toLowerCase().trim();

  for (const section of sections) {
    // Skip private sections if not including private
    if (!includePrivate && section.isPrivate) continue;

    for (const entry of section.entries) {
      if (!includePrivate && entry.isPrivate) continue;

      const matchedFields = findMatchingFields(entry, q);

      if (matchedFields.length > 0) {
        hits.push({
          sectionKey: section.sectionKey as SectionKey,
          entryId: entry._id,
          matchedFields,
          isPrivate: section.isPrivate,
          entryIsPrivate: entry.isPrivate ?? false,
        });
      }
    }
  }

  return hits;
};

/**
 * Recursively walks an object and finds fields whose string values
 * contain the query. Returns field path + matched value snippet.
 */
const findMatchingFields = (
  obj: any,
  query: string,
  prefix = ''
): { field: string; value: string }[] => {
  const matches: { field: string; value: string }[] = [];

  if (!obj || typeof obj !== 'object') return matches;

  for (const [key, value] of Object.entries(obj)) {
    if (key === '_id' || key === 'isPrivate') continue;

    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      if (value.toLowerCase().includes(query)) {
        matches.push({
          field: fieldPath,
          value: truncateSnippet(value, query),
        });
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (typeof item === 'string') {
          if (item.toLowerCase().includes(query)) {
            matches.push({
              field: `${fieldPath}[${idx}]`,
              value: truncateSnippet(item, query),
            });
          }
        } else if (typeof item === 'object') {
          const nested = findMatchingFields(item, query, `${fieldPath}[${idx}]`);
          matches.push(...nested);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      const nested = findMatchingFields(value, query, fieldPath);
      matches.push(...nested);
    }
  }

  return matches;
};

/**
 * Returns a snippet of the matched value with context around the match.
 * E.g. "...worked on React and TypeScript projects at..." instead of the full bio
 */
const truncateSnippet = (value: string, query: string, contextChars = 40): string => {
  const idx = value.toLowerCase().indexOf(query);
  if (idx === -1) return value.slice(0, 80);

  const start = Math.max(0, idx - contextChars);
  const end = Math.min(value.length, idx + query.length + contextChars);

  let snippet = value.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < value.length) snippet = snippet + '...';

  return snippet;
};
