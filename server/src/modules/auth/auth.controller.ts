import type { Request, Response } from "express";
import { AppError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/http.js";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "./cookies.js";
import * as authService from "./auth.service.js";
import { PaperAccount } from "../paper/paper.model.js";

function cookieOpts(tokens: authService.AuthTokens) {
  return { accessTtlMs: tokens.accessTtlMs, refreshTtlMs: tokens.refreshTtlMs };
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, name, password } = req.body as { email: string; name: string; password: string };
  const { user, tokens } = await authService.registerUser({ email, name, password, req });
  const t = cookieOpts(tokens);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken, t.accessTtlMs, t.refreshTtlMs);
  sendSuccess(res, { user, accessToken: tokens.accessToken }, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  const { user, tokens } = await authService.authenticateUser({ email, password, req });
  const t = cookieOpts(tokens);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken, t.accessTtlMs, t.refreshTtlMs);
  sendSuccess(res, { user, accessToken: tokens.accessToken });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  const { user, tokens } = await authService.rotateSession(token, req);
  const t = cookieOpts(tokens);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken, t.accessTtlMs, t.refreshTtlMs);
  sendSuccess(res, { user, accessToken: tokens.accessToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  await authService.revokeSession(token);
  clearAuthCookies(res);
  sendSuccess(res, { loggedOut: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  sendSuccess(res, { user: authService.toPublicUser(req.user), isGuest: Boolean(req.isGuest) });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  // All sessions were revoked; clear cookies on this device too.
  clearAuthCookies(res);
  sendSuccess(res, { changed: true });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  await authService.requestPasswordReset(email);
  sendSuccess(res, {
    requested: true,
    message: "If an account exists, a reset message has been sent.",
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token: string; password: string };
  await authService.resetPassword(token, password);
  sendSuccess(res, { reset: true });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.body as { token: string };
  await authService.verifyEmail(token);
  sendSuccess(res, { verified: true });
}

const DEMO_EMAIL = "demo@nivesh.local";
const DEMO_PASSWORD = "demo-access-nivesh-terminal";

/**
 * Creates (or reuses) a shared, isolated demo account so reviewers can explore
 * every feature without registering. Demo accounts can only see their own data.
 */
export async function demoLogin(req: Request, res: Response): Promise<void> {
  const { User } = await import("../users/user.model.js");
  const { hashPassword } = await import("./password.js");
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (!existing) {
    const user = await User.create({
      email: DEMO_EMAIL,
      name: "Demo Explorer",
      passwordHash: await hashPassword(DEMO_PASSWORD),
      emailVerified: true,
      role: "user",
    });
    await PaperAccount.updateOne(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, startingCash: 1_000_000, cash: 1_000_000, lastResetAt: new Date() } },
      { upsert: true },
    );
  }

  const { user, tokens } = await authService.authenticateUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    req,
  });
  req.isGuest = true;
  const t = cookieOpts(tokens);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken, t.accessTtlMs, t.refreshTtlMs);
  sendSuccess(res, { user, isGuest: true, accessToken: tokens.accessToken });
}
