import rateLimit, { Options } from 'express-rate-limit';

// ─── Shared config ────────────────────────────────────────────────────────────

const isTest = process.env.NODE_ENV === 'test';

/**
 * In test environment we disable rate limiting entirely — otherwise
 * tests that hit the same route repeatedly will get blocked with 429
 * and fail for the wrong reason.
 */
const testSafeOptions = (options: Partial<Options>): Partial<Options> =>
  isTest ? { ...options, max: 0 } : options; // max: 0 = unlimited in express-rate-limit

// ─── Auth limiter ─────────────────────────────────────────────────────────────
// Protects: POST /register, POST /login, PATCH /change-password
// Tight window — 10 attempts per 15 min per IP to prevent brute force

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      isTest ? 0 : 10,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,  // Return RateLimit-* headers (RFC 6585)
  legacyHeaders:   false, // Disable X-RateLimit-* headers
  // Use X-Forwarded-For if behind a proxy (Render, Railway, Vercel, etc.)
  // Set app.set('trust proxy', 1) in app.ts when deploying behind a reverse proxy
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: () => isTest, // Belt-and-suspenders: skip entirely in test env
});

// ─── General API limiter ──────────────────────────────────────────────────────
// Protects: all /api/vault/* and /api/user/* routes
// Looser — 60 requests per minute per IP

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      isTest ? 0 : 60,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: () => isTest,
});

// ─── Refresh token limiter ────────────────────────────────────────────────────
// Protects: POST /api/auth/refresh
// Separate limiter — refresh is called silently by the frontend on page load,
// so it needs a higher limit than login but still needs protection

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      isTest ? 0 : 30,
  message: {
    success: false,
    message: 'Too many token refresh attempts. Please log in again.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: () => isTest,
});
