import crypto from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: "user" | "admin";
  type: "access";
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  type: "refresh";
}

export function signAccessToken(userId: string, role: "user" | "admin"): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"] };
  return jwt.sign({ role, type: "access" }, env.JWT_ACCESS_SECRET, {
    ...options,
    subject: userId,
  });
}

export function signRefreshToken(userId: string, jti: string): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"] };
  return jwt.sign({ jti, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    ...options,
    subject: userId,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (payload.type !== "access") throw new Error("wrong token type");
    return payload;
  } catch {
    throw AppError.unauthorized("Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (payload.type !== "refresh") throw new Error("wrong token type");
    return payload;
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function refreshExpiryDate(): Date {
  const ms = parseDuration(env.JWT_REFRESH_TTL);
  return new Date(Date.now() + ms);
}

/** Minimal duration parser supporting s/m/h/d (matches jsonwebtoken TTL strings). */
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) return 7 * 24 * 3600 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const map: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * (map[unit!] ?? 86_400_000);
}
