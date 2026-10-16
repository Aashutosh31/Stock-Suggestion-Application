import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { User } from "../modules/users/user.model.js";
import { ACCESS_COOKIE } from "../modules/auth/cookies.js";
import { verifyAccessToken } from "../modules/auth/tokens.js";

function extractBearer(req: Request): string | null {
  const header = req.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

function extractToken(req: Request): string | null {
  const bearer = extractBearer(req);
  if (bearer) return bearer;
  const cookie = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
  return cookie ?? null;
}

/** Requires a valid access token; attaches req.user. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) throw AppError.unauthorized();
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw AppError.unauthorized("Account not found");
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Attaches req.user when a valid token is present, but never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch {
    // ignore — anonymous request
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(AppError.unauthorized());
  if (req.user.role !== "admin") return next(AppError.forbidden("Administrator access required"));
  next();
}
