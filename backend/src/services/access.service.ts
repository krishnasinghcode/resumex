import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { PermissionModel } from '../models/Permission';
import { AccessLogModel } from '../models/AccessLog';
import { RefIDModel } from '../models/RefID';
import { AppError } from '../utils/AppError';
import type { RequestedField } from '../types';
import { encrypt, decrypt } from '../utils/crypto';

// Dynamically import VaultSection to avoid circular deps
const getVaultSectionModel = () => require('../models/VaultSection').VaultSectionModel;

// ─── Grant access — user clicks Allow on consent screen ──────────────────────

export const grantAccess = async (userId: string, refCode: string) => {
  const refID = await RefIDModel.findOne({ code: refCode, isActive: true });
  if (!refID) throw new AppError('RefID not found or no longer active', 404);

  // Return existing valid permission if already granted
  const existing = await PermissionModel.findOne({
    userId,
    refId: refID._id,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (existing) return { alreadyGranted: true, permission: existing };

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(rawToken, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + refID.accessDuration);

  const permission = await PermissionModel.create({
    userId,
    companyId: refID.companyId,
    refId: refID._id,
    refIdCode: refID.code,
    grantedFields: refID.requestedFields,
    scopedToken: hashedToken,          // bcrypt hash — for verification
    scopedTokenEncrypted: encrypt(rawToken),    // AES encrypted — for retrieval
    expiresAt,
  });

  // Raw token returned once — after this only the hash exists
  return { alreadyGranted: false, permission };
};

// ─── Fetch candidate data scoped to granted fields ────────────────────────────

export const getCandidateData = async (
  userId: string,
  permissionId: string,
  companyId: string,
  ip: string,
  userAgent: string,
) => {
  const permission = await PermissionModel.findOne({
    _id: permissionId,
    userId,
    companyId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!permission) throw new AppError('Permission not found or expired', 403);

  const VaultSectionModel = getVaultSectionModel();
  const grantedSections = permission.grantedFields.map((f: RequestedField) => f.section);

  const sections = await VaultSectionModel.find({
    userId,
    sectionKey: { $in: grantedSections },
    isPrivate: false,
  });

  const filteredData: Record<string, unknown> = {};

  for (const section of sections) {
    const grantConfig = permission.grantedFields.find(
      (f: RequestedField) => f.section === section.sectionKey
    );

    if (!grantConfig) continue;

    if (!grantConfig.fields || grantConfig.fields.length === 0) {
      filteredData[section.sectionKey] = section.entries;
      continue;
    }

    filteredData[section.sectionKey] = section.entries.map((entry: Record<string, unknown>) => {
      const filtered: Record<string, unknown> = { _id: entry._id };
      grantConfig.fields!.forEach((field: string) => {
        if (entry[field] !== undefined) filtered[field] = entry[field];
      });
      return filtered;
    });
  }

  // Write immutable access log
  await AccessLogModel.create({
    companyId,
    userId,
    permissionId,
    refIdCode: permission.refIdCode,
    fieldsAccessed: permission.grantedFields,
    ip,
    userAgent: userAgent || 'unknown',
  });

  return filteredData;
};

// ─── Revoke access — user withdraws consent ───────────────────────────────────

export const revokeAccess = async (userId: string, permissionId: string): Promise<void> => {
  const permission = await PermissionModel.findOne({ _id: permissionId, userId });
  if (!permission) throw new AppError('Permission not found', 404);

  permission.isRevoked = true;
  await permission.save();
};

// ─── Get all grants for a user ────────────────────────────────────────────────

export const getUserGrants = async (userId: string) => {
  return PermissionModel.find({ userId })
    .populate('companyId', 'name website')
    .populate('refId', 'jobTitle requestedFields accessDuration')
    .sort({ grantedAt: -1 });
};

// Called by company to retrieve the raw scoped token for a specific permission
export const getScopedToken = async (
  permissionId: string,
  companyId:    string,
): Promise<string> => {
  const permission = await PermissionModel.findOne({
    _id:       permissionId,
    companyId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).select('+scopedTokenEncrypted');

  if (!permission)              throw new AppError('Permission not found or expired', 403);
  if (!permission.scopedTokenEncrypted) throw new AppError('Scoped token not available', 404);

  return decrypt(permission.scopedTokenEncrypted);
};