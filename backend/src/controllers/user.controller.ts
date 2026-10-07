import { Response } from 'express';
import { UserModel } from '../models/User';
import { VaultMetaModel } from '../models/VaultMeta';
import { VaultSectionModel } from '../models/VaultSection';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

// ─── GET /api/user/profile ────────────────────────────────────────────────────

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log("getting profile");
  const user = await UserModel.findById(req.user!.userId);
  if (!user) { sendError(res, 'User not found', 404); return; }
  sendSuccess(res, 'Profile retrieved', user);
};

// ─── PATCH /api/user/profile ──────────────────────────────────────────────────

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const allowedFields = ['displayName', 'avatar'];
  const updates: Record<string, any> = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (Object.keys(updates).length === 0) {
    sendError(res, `Nothing to update. Allowed fields: ${allowedFields.join(', ')}`, 400);
    return;
  }

  const user = await UserModel.findByIdAndUpdate(
    req.user!.userId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) { sendError(res, 'User not found', 404); return; }
  sendSuccess(res, 'Profile updated', user);
};

// ─── PATCH /api/user/change-password ─────────────────────────────────────────

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword) {
    sendError(res, 'newPassword is required', 400);
    return;
  }
  if (newPassword.length < 8) {
    sendError(res, 'New password must be at least 8 characters', 400);
    return;
  }

  const user = await UserModel.findById(req.user!.userId).select('+password');
  if (!user) { sendError(res, 'User not found', 404); return; }

  if (user.authProvider === 'google' && !user.password) {
    // Setting password for the first time for a Google user
    user.password = newPassword;
    await user.save();
    sendSuccess(res, 'Password set successfully for Google account. You can now login to the extension.');
    return;
  }

  if (!currentPassword) {
    sendError(res, 'currentPassword is required', 400);
    return;
  }

  if (currentPassword === newPassword) {
    sendError(res, 'New password must differ from current password', 400);
    return;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) { sendError(res, 'Current password is incorrect', 401); return; }

  user.password = newPassword;
  await user.save(); // pre-save hook hashes it

  sendSuccess(res, 'Password changed successfully');
};

// ─── DELETE /api/user/account ─────────────────────────────────────────────────
// Deletes user + entire vault (GDPR compliance)

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const { password } = req.body;
  const userId = req.user!.userId;

  const user = await UserModel.findById(userId).select('+password');
  if (!user) { sendError(res, 'User not found', 404); return; }

  if (user.authProvider === 'local') {
    if (!password) {
      sendError(res, 'Password confirmation required to delete account', 400);
      return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) { sendError(res, 'Incorrect password', 401); return; }
  }

  // Delete everything in parallel
  await Promise.all([
    UserModel.findByIdAndDelete(userId),
    VaultMetaModel.findOneAndDelete({ userId }),
    VaultSectionModel.deleteMany({ userId }),
  ]);

  res.clearCookie('refreshToken', { path: '/api/auth' });
  sendSuccess(res, 'Account and all associated data permanently deleted');
};
