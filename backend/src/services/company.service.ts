import bcrypt from 'bcrypt';
import { CompanyModel } from '../models/Company';
import { generateRefreshToken, generateAccessToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { generateUniqueCompanySlug } from '../utils/refid';

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerCompany = async (
  name:      string,
  email:     string,
  password:  string,
  website?:  string,
  industry?: string,
) => {
  const existing = await CompanyModel.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('Email already registered', 409);

  const allSlugs = await CompanyModel.distinct('slug');
  const slug     = generateUniqueCompanySlug(name, allSlugs);

  const company = await CompanyModel.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    slug,
    website,
    industry,
  });

  const payload      = { userId: company._id.toString(), email: company.email, role: 'company' as const };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await CompanyModel.updateOne(
    { _id: company._id },
    { $push: { refreshTokens: await bcrypt.hash(refreshToken, 10) } }
  );

  return { company, accessToken, refreshToken };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginCompany = async (email: string, password: string) => {
  const company = await CompanyModel.findOne({ email: email.toLowerCase() })
    .select('+password +refreshTokens');

  if (!company) throw new AppError('Invalid email or password', 401);

  const isMatch = await company.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const payload      = { userId: company._id.toString(), email: company.email, role: 'company' as const };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  company.refreshTokens.push(await bcrypt.hash(refreshToken, 10));
  await company.save();

  return { company, accessToken, refreshToken };
};

// ─── Refresh tokens ───────────────────────────────────────────────────────────

export const refreshCompanyTokens = async (incomingToken: string) => {
  const decoded = verifyRefreshToken(incomingToken);
  if (decoded.role !== 'company') throw new AppError('Invalid token type', 401);

  const company = await CompanyModel.findById(decoded.userId).select('+refreshTokens');
  if (!company) throw new AppError('Company not found', 404);

  let matchedIndex = -1;
  for (let i = 0; i < company.refreshTokens.length; i++) {
    const isMatch = await bcrypt.compare(incomingToken, company.refreshTokens[i]);
    if (isMatch) { matchedIndex = i; break; }
  }

  if (matchedIndex === -1) {
    await CompanyModel.updateOne({ _id: company._id }, { $set: { refreshTokens: [] } });
    throw new AppError('Token reuse detected — all sessions revoked', 401);
  }

  company.refreshTokens.splice(matchedIndex, 1);
  const payload      = { userId: company._id.toString(), email: company.email, role: 'company' as const };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  company.refreshTokens.push(await bcrypt.hash(refreshToken, 10));
  await company.save();

  return { accessToken, refreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutCompany = async (companyId: string, refreshToken: string): Promise<void> => {
  const company = await CompanyModel.findById(companyId).select('+refreshTokens');
  if (!company) return;

  let matchedIndex = -1;
  for (let i = 0; i < company.refreshTokens.length; i++) {
    const isMatch = await bcrypt.compare(refreshToken, company.refreshTokens[i]);
    if (isMatch) { matchedIndex = i; break; }
  }

  if (matchedIndex !== -1) {
    company.refreshTokens.splice(matchedIndex, 1);
    await company.save();
  }
};
