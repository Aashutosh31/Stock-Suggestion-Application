import { Router } from "express";
import { z } from "zod";
import * as controller from "./auth.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { authLimiter } from "../../middlewares/rateLimit.js";
import { validate } from "../../middlewares/validate.js";

const email = z
  .string()
  .trim()
  .max(254)
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validate({ body: z.object({ email, name: z.string().trim().min(2).max(80), password }).strict() }),
  asyncHandler(controller.register),
);

authRouter.post(
  "/login",
  authLimiter,
  validate({ body: z.object({ email, password: z.string().min(1).max(128) }).strict() }),
  asyncHandler(controller.login),
);

authRouter.post("/refresh", asyncHandler(controller.refresh));
authRouter.post("/logout", asyncHandler(controller.logout));
authRouter.post("/demo", authLimiter, asyncHandler(controller.demoLogin));
authRouter.get("/me", requireAuth, asyncHandler(controller.me));

authRouter.post(
  "/password/change",
  requireAuth,
  validate({
    body: z
      .object({
        currentPassword: z.string().min(1).max(128),
        newPassword: password,
      })
      .strict(),
  }),
  asyncHandler(controller.changePassword),
);

authRouter.post(
  "/password/forgot",
  authLimiter,
  validate({ body: z.object({ email }).strict() }),
  asyncHandler(controller.forgotPassword),
);

authRouter.post(
  "/password/reset",
  authLimiter,
  validate({ body: z.object({ token: z.string().min(10).max(256), password }).strict() }),
  asyncHandler(controller.resetPassword),
);

authRouter.post(
  "/verify-email",
  validate({ body: z.object({ token: z.string().min(10).max(256) }).strict() }),
  asyncHandler(controller.verifyEmail),
);
