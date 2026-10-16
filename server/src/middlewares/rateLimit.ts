import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env.js";

function commonOptions(max: number): Partial<Options> {
  return {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Disable in tests so suites are deterministic.
    skip: () => env.isTest,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests, please slow down." },
      });
    },
  };
}

export const apiLimiter = rateLimit(commonOptions(env.RATE_LIMIT_MAX));

export const authLimiter = rateLimit({
  ...commonOptions(env.LOGIN_RATE_LIMIT_MAX),
  windowMs: 15 * 60 * 1000,
});

export const writeLimiter = rateLimit({
  ...commonOptions(Math.max(60, Math.round(env.RATE_LIMIT_MAX / 2))),
  windowMs: 60 * 1000,
});
