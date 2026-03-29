import crypto from 'crypto';

// ─── RefID format: RESUMEX-{COMPANY}-{JOB}-{TOKEN}-{YEAR} ────────────────────
//
// RESUMEX  — platform identity, always fixed
// COMPANY  — 3-char slug derived from company name  (e.g. Stripe  → STR)
// JOB      — 4-char slug derived from job title     (e.g. Frontend Dev → FEND)
// TOKEN    — 8-char cryptographically random hex    (the actual security layer)
// YEAR     — 4-digit year of creation               (temporal context)
//
// Example: RESUMEX-STR-FEND-4A7FK2M9-2026
//
// NOTE: This function is the ONLY place the format lives.
// To change the format later, edit only this file. Nothing else needs to change.

export const generateRefIDCode = (companySlug: string, jobTitle: string): string => {
  const company = deriveCompanyCode(companySlug);
  const job     = deriveJobCode(jobTitle);
  const token   = generateSecureToken();
  const year    = new Date().getFullYear();

  return `RESUMEX-${company}-${job}-${token}-${year}`;
};

// Derives a 3-char company code from the stored slug.
// e.g. 'stripe' → 'STR', 'google' → 'GOO', 'anthropic' → 'ANT'
const deriveCompanyCode = (slug: string): string => {
  return slug
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X');
};

// Derives a 4-char job code from the job title.
// e.g. 'Frontend Developer' → 'FRDE', 'SWE Intern' → 'SWEI', 'ML Engineer' → 'MLEN'
const deriveJobCode = (jobTitle: string): string => {
  const words = jobTitle.trim().split(/\s+/);

  if (words.length >= 4) {
    return words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
  }

  if (words.length >= 2) {
    const first  = words[0].slice(0, 2).toUpperCase().padEnd(2, 'X');
    const second = words[1].slice(0, 2).toUpperCase().padEnd(2, 'X');
    return first + second;
  }

  return words[0].slice(0, 4).toUpperCase().padEnd(4, 'X');
};

// 8-char uppercase hex — 4 billion combinations
// crypto.randomBytes is cryptographically secure (not Math.random)
const generateSecureToken = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Generates a unique company slug, checking against taken slugs to avoid collisions.
// If 'STR' is taken, returns 'ST2', then 'ST3', etc.
export const generateUniqueCompanySlug = (
  companyName: string,
  takenSlugs:  string[],
): string => {
  const base = companyName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 3)
    .padEnd(3, 'x');

  if (!takenSlugs.includes(base)) return base;

  for (let i = 2; i <= 99; i++) {
    const candidate = base.slice(0, 2) + i;
    if (!takenSlugs.includes(candidate)) return candidate;
  }

  // Fallback — extremely unlikely to reach
  return base + crypto.randomBytes(1).toString('hex');
};
