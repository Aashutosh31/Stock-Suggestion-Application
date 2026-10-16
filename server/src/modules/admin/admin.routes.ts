import { Router } from "express";
import { env } from "../../config/env.js";
import { isDatabaseReady } from "../../config/db.js";
import { AppError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { appCache } from "../../utils/cache.js";
import { optionalAuth } from "../../middlewares/auth.js";
import { metricsSnapshot } from "../../middlewares/metrics.js";
import { marketService } from "../market/market.service.js";
import { isMailEnabled } from "../notifications/mail.service.js";

/** Allows access with either an admin account or the configured diagnostics token. */
function requireAdminAccess(req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) {
  const token = req.get("x-admin-token");
  const configured = env.ADMIN_DIAGNOSTICS_TOKEN;
  const tokenOk = Boolean(configured) && token === configured;
  const userOk = req.user?.role === "admin";
  if (!tokenOk && !userOk) return next(AppError.forbidden("Administrator access required"));
  next();
}

export const adminRouter = Router();
adminRouter.use(optionalAuth, requireAdminAccess);

adminRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const provider = await marketService.health();
    sendSuccess(res, {
      status: provider.status === "down" ? "degraded" : "ok",
      database: isDatabaseReady() ? "connected" : "disconnected",
      provider,
      cache: appCache.stats(),
      checkedAt: new Date().toISOString(),
    });
  }),
);

adminRouter.get(
  "/metrics",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, metricsSnapshot());
  }),
);

adminRouter.get(
  "/diagnostics",
  asyncHandler(async (_req, res) => {
    // Report only presence booleans — never the values of secrets.
    sendSuccess(res, {
      environment: env.NODE_ENV,
      appName: env.APP_NAME,
      provider: marketService.providerInfo,
      configured: {
        mongodb: Boolean(env.MONGODB_URI),
        jwtAccessSecret: Boolean(env.JWT_ACCESS_SECRET),
        jwtRefreshSecret: Boolean(env.JWT_REFRESH_SECRET),
        smtp: isMailEnabled(),
        aiExplain: env.AI_EXPLAIN_ENABLED && Boolean(env.GROQ_API_KEY),
        adminToken: Boolean(env.ADMIN_DIAGNOSTICS_TOKEN),
        secureCookies: env.COOKIE_SECURE,
      },
      clientOrigins: env.clientOrigins,
      cache: appCache.stats(),
      uptimeSeconds: Math.round(process.uptime()),
    });
  }),
);
