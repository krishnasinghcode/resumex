import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { bootstrapVault } from './vault.service';
import { AppError } from '../utils/AppError';
import { JwtPayload } from '../types';

interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Register ────────────────────────────────────────────────────────────────

export const registerUser = async (input: RegisterInput) => {
  const { email, password, displayName } = input;

  const existing = await UserModel.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await UserModel.create({
    email,
    password,
    displayName,
    authProvider: 'local',
  });

  await bootstrapVault(user._id.toString());

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const hashed = await bcrypt.hash(refreshToken, 10);
  await UserModel.findByIdAndUpdate(user._id, { $push: { refreshTokens: hashed } });

  return { user, accessToken, refreshToken };
};

// ─── Login ───────────────────────────────────────────────────────────────────

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await UserModel.findOne({ email }).select('+password +refreshTokens');
  if (!user) throw new AppError('Invalid email or password', 401);

  if (user.authProvider === 'google' && !user.password) {
    throw new AppError('This account uses Google login. Please sign in with Google.', 400);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const hashed = await bcrypt.hash(refreshToken, 10);
  await UserModel.findByIdAndUpdate(user._id, { $push: { refreshTokens: hashed } });

  return { user, accessToken, refreshToken };
};

// ─── Refresh ──────────────────────────────────────────────────────────────────

export const refreshTokens = async (incomingToken: string): Promise<AuthTokens> => {
  const decoded = verifyRefreshToken(incomingToken);

  const user = await UserModel.findById(decoded.userId).select('+refreshTokens');
  if (!user) throw new AppError('User not found', 401);

  let matchedIndex = -1;
  for (let i = 0; i < user.refreshTokens.length; i++) {
    const isMatch = await bcrypt.compare(incomingToken, user.refreshTokens[i]);
    if (isMatch) { matchedIndex = i; break; }
  }

  if (matchedIndex === -1) {
    // Reuse detected — wipe all sessions
    await UserModel.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });
    throw new AppError('Refresh token reuse detected — all sessions revoked', 401);
  }

  // Rotate
  user.refreshTokens.splice(matchedIndex, 1);

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const newAccessToken  = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  const hashed = await bcrypt.hash(newRefreshToken, 10);
  user.refreshTokens.push(hashed);
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutUser = async (userId: string, refreshToken: string): Promise<void> => {
  const user = await UserModel.findById(userId).select('+refreshTokens');
  if (!user) return;

  const filtered: string[] = [];
  for (const stored of user.refreshTokens) {
    const isMatch = await bcrypt.compare(refreshToken, stored);
    if (!isMatch) filtered.push(stored);
  }

  await UserModel.findByIdAndUpdate(userId, { $set: { refreshTokens: filtered } });
};

// ─── Logout all ───────────────────────────────────────────────────────────────

export const logoutAllDevices = async (userId: string): Promise<void> => {
  await UserModel.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
};

// ─── For OAuth users ──────────────────────────────────────────────────────────

export const generateTokensForOAuthUser = async (
  userId: string,
  email: string,
  role: 'user' | 'company'
): Promise<AuthTokens> => {
  const payload: JwtPayload = { userId, email, role };

  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const hashed = await bcrypt.hash(refreshToken, 10);
  await UserModel.findByIdAndUpdate(userId, { $push: { refreshTokens: hashed } });

  return { accessToken, refreshToken };
};
