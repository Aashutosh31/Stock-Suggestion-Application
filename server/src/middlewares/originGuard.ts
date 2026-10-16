import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defense for cookie-authenticated requests: for state-changing methods we
 * require that any present Origin/Referer matches the configured allowlist.
 * Combined with SameSite cookies this blocks cross-site form/fetch attacks.
 * Bearer-token requests (no browser cookie) are unaffected.
 */
export function originGuard(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get("origin") ?? req.get("referer");
  if (!origin) return next(); // non-browser client or same-origin navigation
  const allowed = env.clientOrigins.some((o) => origin === o || origin.startsWith(`${o}/`));
  if (!allowed) {
    return next(Object.assign(new Error("CORS origin rejected"), { statusCode: 403 }));
  }
  next();
}
