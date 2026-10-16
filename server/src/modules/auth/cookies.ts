import { randomUUID } from "node:crypto";
import type { CookieOptions, Response } from "express";
import { env } from "../../config/env.js";

export const ACCESS_COOKIE = "nv_access";
export const REFRESH_COOKIE = "nv_refresh";
export const CSRF_COOKIE = "nv_csrf";

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.isProduction ? "strict" : "lax",
    domain: env.COOKIE_DOMAIN && env.COOKIE_DOMAIN.length > 0 ? env.COOKIE_DOMAIN : undefined,
    path: "/",
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  accessTtlMs: number,
  refreshTtlMs: number,
): void {
  res.cookie(ACCESS_COOKIE, accessToken, { ...baseCookieOptions(), maxAge: accessTtlMs });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...baseCookieOptions(), maxAge: refreshTtlMs });
  // Readable CSRF token for the double-submit cookie pattern (not httpOnly by design).
  res.cookie(CSRF_COOKIE, randomUUID(), {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: env.isProduction ? "strict" : "lax",
    path: "/",
    maxAge: refreshTtlMs,
  });
}

export function clearAuthCookies(res: Response): void {
  const opts = baseCookieOptions();
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
  res.clearCookie(CSRF_COOKIE, { ...opts, httpOnly: false });
}
