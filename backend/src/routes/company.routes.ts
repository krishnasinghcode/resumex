import { Router } from 'express';
import type { Response, Request } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { protectCompany } from '../middleware/protectCompany';
import { validateCompanyRegister, validateCompanyLogin } from '../validators/company.validator';
import { sendSuccess, sendError } from '../utils/response';
import * as CompanyService from '../services/company.service';
import * as AccessService from '../services/access.service';
import * as RefIDService from '../services/refid.service';
import { AccessLogModel } from '../models/AccessLog';
import { CompanyModel } from '../models/Company';
import { PermissionModel } from '../models/Permission';
import { AppError } from '../utils/AppError';
import type { CompanyRequest } from '../types';
import { env } from '../config/env';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post('/register', validateCompanyRegister, asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, website, industry } = req.body;
  const { company, accessToken, refreshToken } =
    await CompanyService.registerCompany(name, email, password, website, industry);
  res.cookie('companyRefreshToken', refreshToken, COOKIE_OPTIONS);
  sendSuccess(res, 'Company registered', { company, accessToken }, 201);
}));

router.post('/login', validateCompanyLogin, asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { company, accessToken, refreshToken } =
    await CompanyService.loginCompany(email, password);
  res.cookie('companyRefreshToken', refreshToken, COOKIE_OPTIONS);
  sendSuccess(res, 'Login successful', { company, accessToken });
}));

router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.companyRefreshToken;
  if (!token) { res.status(401).json({ success: false, message: 'No refresh token' }); return; }
  const { accessToken, refreshToken } = await CompanyService.refreshCompanyTokens(token);
  res.cookie('companyRefreshToken', refreshToken, COOKIE_OPTIONS);
  sendSuccess(res, 'Token refreshed', { accessToken });
}));

router.post('/logout', protectCompany, asyncHandler(async (req: CompanyRequest, res: Response) => {
  const token = req.cookies?.companyRefreshToken;
  if (token) await CompanyService.logoutCompany(req.company!.userId, token);
  res.clearCookie('companyRefreshToken');
  sendSuccess(res, 'Logged out');
}));

// ─── Profile ──────────────────────────────────────────────────────────────────

router.get('/profile', protectCompany, asyncHandler(async (req: CompanyRequest, res: Response) => {
  const company = await CompanyModel.findById(req.company!.userId);
  if (!company) throw new AppError('Company not found', 404);
  sendSuccess(res, 'Profile fetched', { company });
}));

router.patch('/profile', protectCompany, asyncHandler(async (req: CompanyRequest, res: Response) => {
  const { name, website, industry } = req.body;
  const company = await CompanyModel.findByIdAndUpdate(
    req.company!.userId,
    {
      $set: {
        ...(name !== undefined && { name }),
        ...(website !== undefined && { website }),
        ...(industry !== undefined && { industry }),
      }
    },
    { new: true }
  );
  if (!company) throw new AppError('Company not found', 404);
  sendSuccess(res, 'Profile updated', { company });
}));

router.patch('/password', protectCompany, asyncHandler(async (req: CompanyRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    sendError(res, 'Both currentPassword and newPassword are required', 400);
    return;
  }
  if (newPassword.length < 8) {
    sendError(res, 'New password must be at least 8 characters', 422);
    return;
  }

  const company = await CompanyModel.findById(req.company!.userId).select('+password');
  if (!company) throw new AppError('Company not found', 404);

  const isMatch = await company.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  company.password = newPassword; // pre-save hook hashes it
  await company.save();

  sendSuccess(res, 'Password updated');
}));

// ─── Access logs ──────────────────────────────────────────────────────────────

router.get('/logs', protectCompany, asyncHandler(async (req: CompanyRequest, res: Response) => {
  const logs = await AccessLogModel.find({ companyId: req.company!.userId })
    .populate('userId', 'displayName email')
    .sort({ accessedAt: -1 })
    .limit(200);
  sendSuccess(res, 'Access logs fetched', { logs });
}));

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get('/dashboard', protectCompany, asyncHandler(async (req: CompanyRequest, res: Response) => {
  const refIDs = await RefIDService.getCompanyRefIDs(req.company!.userId);
  sendSuccess(res, 'Dashboard data fetched', { refIDs });
}));

router.get('/refid/:refCode/candidates', protectCompany, asyncHandler(async (req: CompanyRequest, res: Response) => {
  const data = await RefIDService.getRefIDCandidates(req.params.refCode, req.company!.userId);
  sendSuccess(res, 'Candidates fetched', data);
}));

// ─── Scoped candidate access ──────────────────────────────────────────────────
// GET /api/company/candidate/:userId — view candidate data using scoped token
router.get(
  '/candidate/:userId',
  protectCompany,
  asyncHandler(async (req: CompanyRequest, res: Response) => {
    const permissionId = req.query.permissionId as string;

    if (!permissionId) {
      throw new AppError('Permission ID is required', 400);
    }

    const permission = await PermissionModel.findOne({
      _id: permissionId,
      userId: req.params.userId,
      companyId: req.company!.userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!permission) {
      throw new AppError('Permission not found or expired', 403);
    }

    const data = await AccessService.getCandidateData(
      permission,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
    );

    sendSuccess(res, 'Candidate data fetched', data);
  })
);

export default router;