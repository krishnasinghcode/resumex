import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  logoutAllDevices,
  generateTokensForOAuthUser,
} from '../services/auth.service';
import { REFRESH_COOKIE_OPTIONS } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import { env } from '../config/env';

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Validation is handled by validateRegister middleware before this runs

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, displayName } = req.body;
  const { user, accessToken, refreshToken } = await registerUser({ email, password, displayName });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, 'Registration successful', { user, accessToken }, 201);
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await loginUser({ email, password });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, 'Login successful', { user, accessToken });
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const incomingToken = req.cookies?.refreshToken;

  if (!incomingToken) {
    sendError(res, 'No refresh token provided', 401);
    return;
  }

  const { accessToken, refreshToken } = await refreshTokens(incomingToken);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, 'Token refreshed', { accessToken });
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  const incomingToken = req.cookies?.refreshToken;

  if (req.user && incomingToken) {
    await logoutUser(req.user.userId, incomingToken);
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  sendSuccess(res, 'Logged out successfully');
};

// ─── POST /api/auth/logout-all ────────────────────────────────────────────────

export const logoutAll = async (req: AuthRequest, res: Response): Promise<void> => {
  await logoutAllDevices(req.user!.userId);
  res.clearCookie('refreshToken', { path: '/api/auth' });
  sendSuccess(res, 'Logged out from all devices');
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  sendSuccess(res, 'Authenticated user', { user: req.user });
};

// ─── GET /api/auth/google/callback ───────────────────────────────────────────
// Passport has already authenticated and attached user to req before this runs

export const googleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user as any;

  if (!user) {
    res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    return;
  }

  const { accessToken, refreshToken } = await generateTokensForOAuthUser(
    user._id.toString(),
    user.email,
    user.role
  );

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  // Pass access token to frontend via query param — frontend stores in memory only
  res.redirect(`${env.CLIENT_URL}/oauth/callback?token=${accessToken}`);
};
