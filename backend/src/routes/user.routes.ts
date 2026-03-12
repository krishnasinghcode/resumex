import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { apiLimiter, authLimiter } from '../middleware/rateLimiter.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// All user routes require authentication
router.use(protect, apiLimiter);

router.get('/profile',          asyncHandler(getProfile));
router.patch('/profile',        asyncHandler(updateProfile));
router.patch('/change-password', authLimiter, asyncHandler(changePassword));
router.delete('/account',       authLimiter, asyncHandler(deleteAccount));

export default router;
