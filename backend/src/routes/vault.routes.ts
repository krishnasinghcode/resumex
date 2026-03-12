import { Router } from 'express';
import {
  getVaultMeta,
  getSection,
  addOrSetEntry,
  updateEntry,
  deleteEntry,
  toggleSectionPrivacy,
  toggleEntryPrivacy,
  exportVault,
} from '../controllers/vault.controller';
import { search } from '../controllers/search.controller';
import { protect } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  validateSectionKey,
  validateEntryBody,
  validatePrivacyToggle,
  validateSearchQuery,
} from '../validators/vault.validator';

const router = Router();

// All vault routes require authentication
router.use(protect, apiLimiter);

// ─── Vault overview & export ──────────────────────────────────────────────────
router.get('/meta',   asyncHandler(getVaultMeta));
router.get('/export', asyncHandler(exportVault));

// ─── Search across all sections ───────────────────────────────────────────────
router.get('/search', validateSearchQuery, asyncHandler(search));

// ─── Section level ────────────────────────────────────────────────────────────
router.get(
  '/section/:sectionKey',
  validateSectionKey,
  asyncHandler(getSection)
);
router.patch(
  '/section/:sectionKey/privacy',
  validateSectionKey,
  validatePrivacyToggle,
  asyncHandler(toggleSectionPrivacy)
);

// ─── Entry level ──────────────────────────────────────────────────────────────
router.post(
  '/section/:sectionKey/entry',
  validateSectionKey,
  validateEntryBody,
  asyncHandler(addOrSetEntry)
);
router.patch(
  '/section/:sectionKey/entry/:entryId',
  validateSectionKey,
  asyncHandler(updateEntry)
);
router.delete(
  '/section/:sectionKey/entry/:entryId',
  validateSectionKey,
  asyncHandler(deleteEntry)
);
router.patch(
  '/section/:sectionKey/entry/:entryId/privacy',
  validateSectionKey,
  validatePrivacyToggle,
  asyncHandler(toggleEntryPrivacy)
);

export default router;
