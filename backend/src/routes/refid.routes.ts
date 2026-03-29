import { Router } from 'express';
import type { Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { protect } from '../middleware/auth.middleware';
import { protectCompany } from '../middleware/protectCompany';
import { validateCreateRefID } from '../validators/company.validator';
import { sendSuccess } from '../utils/response';
import * as RefIDService from '../services/refid.service';
import * as AccessService from '../services/access.service';
import type { AuthRequest, CompanyRequest } from '../types';

const router = Router();

// ─── Company-facing ───────────────────────────────────────────────────────────

// POST /api/refid — create a new RefID
router.post('/', protectCompany, validateCreateRefID, asyncHandler(async (req: CompanyRequest, res: Response) => {
  const { jobTitle, requestedFields, accessDuration } = req.body;
  const refID = await RefIDService.createRefID(
    req.company!.userId,
    jobTitle,
    requestedFields,
    Number(accessDuration),
  );
  sendSuccess(res, 'RefID created', { refID }, 201);
}));

// PATCH /api/refid/:code/deactivate
router.patch('/:code/deactivate', protectCompany, asyncHandler(async (req: CompanyRequest, res: Response) => {
  await RefIDService.deactivateRefID(req.params.code, req.company!.userId);
  sendSuccess(res, 'RefID deactivated');
}));

// PATCH /api/refid/:code/activate
router.patch('/:code/activate', protectCompany, asyncHandler(async (req: CompanyRequest, res: Response) => {
  await RefIDService.activateRefID(req.params.code, req.company!.userId);
  sendSuccess(res, 'RefID activated');
}));

// ─── Candidate-facing ─────────────────────────────────────────────────────────

// GET /api/refid/grants/mine — must come BEFORE /:code to avoid route conflict
router.get('/grants/mine', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const grants = await AccessService.getUserGrants(req.user!.userId);
  sendSuccess(res, 'Grants fetched', { grants });
}));

// GET /api/refid/:code — public, used for consent screen
router.get('/:code', asyncHandler(async (req, res: Response) => {
  const refID = await RefIDService.getRefIDByCode(req.params.code);
  sendSuccess(res, 'RefID fetched', { refID });
}));

// POST /api/refid/:code/grant — user grants access
router.post('/:code/grant', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await AccessService.grantAccess(req.user!.userId, req.params.code);
  sendSuccess(res, result.alreadyGranted ? 'Access already granted' : 'Access granted', result, 201);
}));

// DELETE /api/refid/grants/:permissionId — user revokes a grant
router.delete('/grants/:permissionId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  await AccessService.revokeAccess(req.user!.userId, req.params.permissionId);
  sendSuccess(res, 'Access revoked');
}));

export default router;
