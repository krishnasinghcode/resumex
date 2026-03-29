import { RefIDModel } from '../models/RefID';
import { CompanyModel } from '../models/Company';
import { PermissionModel } from '../models/Permission';
import { AppError } from '../utils/AppError';
import { generateRefIDCode } from '../utils/refid';
import type { RequestedField } from '../types';

// ─── Create ───────────────────────────────────────────────────────────────────

export const createRefID = async (
  companyId:       string,
  jobTitle:        string,
  requestedFields: RequestedField[],
  accessDuration:  number,
) => {
  const company = await CompanyModel.findById(companyId);
  if (!company) throw new AppError('Company not found', 404);

  const code = generateRefIDCode(company.slug, jobTitle);

  return RefIDModel.create({ code, companyId, jobTitle: jobTitle.trim(), requestedFields, accessDuration });
};

// ─── Get by code — candidate consent screen ───────────────────────────────────

export const getRefIDByCode = async (code: string) => {
  const refID = await RefIDModel.findOne({ code, isActive: true })
    .populate('companyId', 'name website industry');
  if (!refID) throw new AppError('RefID not found or no longer active', 404);
  return refID;
};

// ─── Get all for a company — dashboard ───────────────────────────────────────

export const getCompanyRefIDs = async (companyId: string) => {
  const refIDs = await RefIDModel.find({ companyId }).sort({ createdAt: -1 });

  return Promise.all(
    refIDs.map(async (ref) => {
      const candidateCount = await PermissionModel.countDocuments({
        refId:     ref._id,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      });
      return { ...ref.toObject(), candidateCount };
    })
  );
};

// ─── Get candidates for a RefID ───────────────────────────────────────────────

export const getRefIDCandidates = async (refIdCode: string, companyId: string) => {
  const refID = await RefIDModel.findOne({ code: refIdCode, companyId });
  if (!refID) throw new AppError('RefID not found', 404);

  const permissions = await PermissionModel.find({ refId: refID._id, isRevoked: false })
    .populate('userId', 'displayName email');

  return { refID, permissions };
};

// ─── Deactivate ───────────────────────────────────────────────────────────────

export const deactivateRefID = async (code: string, companyId: string): Promise<void> => {
  const refID = await RefIDModel.findOne({ code, companyId });
  if (!refID) throw new AppError('RefID not found', 404);
  refID.isActive = false;
  await refID.save();
};

// ─── Activate ─────────────────────────────────────────────────────────────────

export const activateRefID = async (code: string, companyId: string): Promise<void> => {
  const refID = await RefIDModel.findOne({ code, companyId });
  if (!refID) throw new AppError('RefID not found', 404);
  refID.isActive = true;
  await refID.save();
};
