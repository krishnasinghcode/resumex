import { Router } from 'express';
import passport from 'passport';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  googleCallback,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter, refreshLimiter } from '../middleware/rateLimiter.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateRegister, validateLogin } from '../validators/auth.validator';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/register', authLimiter,    validateRegister, asyncHandler(register));
router.post('/login',    authLimiter,    validateLogin,    asyncHandler(login));
router.post('/refresh',  refreshLimiter,                   asyncHandler(refresh));

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  asyncHandler(googleCallback)
);

// ─── Protected ────────────────────────────────────────────────────────────────
router.post('/logout',     protect, asyncHandler(logout));
router.post('/logout-all', protect, asyncHandler(logoutAll));
router.get('/me',          protect, asyncHandler(getMe));

export default router;
