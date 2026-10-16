import type { Request } from "express";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/errors.js";
import { sendMail } from "../notifications/mail.service.js";
import { Portfolio } from "../portfolio/portfolio.model.js";
import { User, type UserDoc } from "../users/user.model.js";
import { Watchlist } from "../watchlists/watchlist.model.js";
import { PaperAccount } from "../paper/paper.model.js";
import { hashPassword, verifyPassword } from "./password.js";
import { Session } from "./session.model.js";
import {
  generateOpaqueToken,
  hashToken,
  parseDuration,
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./tokens.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTtlMs: number;
  refreshTtlMs: number;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  emailVerified: boolean;
  preferences: UserDoc["preferences"];
  createdAt: string;
}

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    preferences: user.preferences,
    createdAt: user.createdAt.toISOString(),
  };
}

async function issueTokens(user: UserDoc, req: Request): Promise<AuthTokens> {
  const jti = generateOpaqueToken(16);
  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, jti);
  await Session.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: req.get("user-agent") ?? null,
    ip: req.ip ?? null,
    expiresAt: refreshExpiryDate(),
  });
  return {
    accessToken,
    refreshToken,
    accessTtlMs: parseDuration(env.JWT_ACCESS_TTL),
    refreshTtlMs: parseDuration(env.JWT_REFRESH_TTL),
  };
}

async function ensureUserCollections(userId: UserDoc["_id"]): Promise<void> {
  await Promise.all([
    Watchlist.updateOne(
      { userId, name: "My Watchlist" },
      { $setOnInsert: { userId, name: "My Watchlist", items: [] } },
      { upsert: true },
    ),
    Portfolio.updateOne(
      { userId, name: "My Portfolio" },
      { $setOnInsert: { userId, name: "My Portfolio", isDefault: true, baseCurrency: "INR" } },
      { upsert: true },
    ),
    PaperAccount.updateOne(
      { userId },
      { $setOnInsert: { userId, startingCash: 1_000_000, cash: 1_000_000, lastResetAt: new Date() } },
      { upsert: true },
    ),
  ]);
}

export async function registerUser(input: {
  email: string;
  name: string;
  password: string;
  req: Request;
}): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) throw AppError.conflict("An account with this email already exists");

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({ email, name: input.name.trim(), passwordHash });
  await ensureUserCollections(user._id);

  const verificationToken = generateOpaqueToken();
  user.emailVerificationTokenHash = hashToken(verificationToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 3600_000);
  await user.save();

  await sendMail({
    to: email,
    subject: "Verify your Nivesh Terminal account",
    text: `Welcome to Nivesh Terminal.\n\nVerify your email with this token (valid 24h): ${verificationToken}\n`,
  });

  const tokens = await issueTokens(user, input.req);
  return { user: toPublicUser(user), tokens };
}

export async function authenticateUser(input: {
  email: string;
  password: string;
  req: Request;
}): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const email = input.email.toLowerCase().trim();
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    // Constant-ish work to reduce user enumeration timing signal.
    await verifyPassword(input.password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
    throw AppError.unauthorized("Invalid email or password");
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw AppError.unauthorized("Invalid email or password");

  user.lastLoginAt = new Date();
  await user.save();
  const tokens = await issueTokens(user, input.req);
  return { user: toPublicUser(user), tokens };
}

export async function rotateSession(refreshToken: string | undefined, req: Request): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  if (!refreshToken) throw AppError.unauthorized("No refresh token provided");
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);
  const session = await Session.findOne({ tokenHash });
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    throw AppError.unauthorized("Session is no longer valid");
  }
  const user = await User.findById(payload.sub);
  if (!user) throw AppError.unauthorized("Account not found");

  // Rotate: revoke old, issue new.
  session.revokedAt = new Date();
  await session.save();
  const tokens = await issueTokens(user, req);
  return { user: toPublicUser(user), tokens };
}

export async function revokeSession(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  await Session.updateOne({ tokenHash: hashToken(refreshToken) }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await Session.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function getUserById(userId: string): Promise<UserDoc | null> {
  return User.findById(userId);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw AppError.notFound("Account not found");
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw AppError.badRequest("Current password is incorrect");
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await revokeAllSessions(userId);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Always behave the same to avoid account enumeration.
  if (!user) {
    logger.info({ email }, "password reset requested for unknown account");
    return;
  }
  const token = generateOpaqueToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpires = new Date(Date.now() + 3600_000);
  await user.save();
  await sendMail({
    to: user.email,
    subject: "Reset your Nivesh Terminal password",
    text: `Use this token to reset your password (valid 1 hour): ${token}\n\nIf you did not request this, ignore this email.\n`,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordHash +passwordResetTokenHash +passwordResetExpires");
  if (!user) throw AppError.badRequest("Reset token is invalid or has expired");
  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();
  await revokeAllSessions(user.id);
}

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");
  if (!user) throw AppError.badRequest("Verification token is invalid or has expired");
  user.emailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpires = null;
  await user.save();
}
