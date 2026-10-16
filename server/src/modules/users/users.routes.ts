import { Router } from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import { AppError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { toPublicUser } from "../auth/auth.service.js";
import { clearAuthCookies } from "../auth/cookies.js";
import { Session } from "../auth/session.model.js";
import { Alert, Notification } from "../alerts/alert.model.js";
import { PaperAccount, PaperTrade } from "../paper/paper.model.js";
import { Portfolio, Transaction } from "../portfolio/portfolio.model.js";
import { RecentlyViewed, ResearchNote, SavedScreen } from "../research/research.model.js";
import { User } from "./user.model.js";
import { Watchlist } from "../watchlists/watchlist.model.js";

async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const { name } = req.body as { name: string };
  req.user.name = name;
  await req.user.save();
  sendSuccess(res, { user: toPublicUser(req.user) });
}

async function updatePreferences(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const patch = req.body as Record<string, unknown>;
  const prefs = req.user.preferences;
  if (typeof patch.theme === "string") prefs.theme = patch.theme as typeof prefs.theme;
  if (typeof patch.timezone === "string") prefs.timezone = patch.timezone;
  if (typeof patch.numberFormat === "string") prefs.numberFormat = patch.numberFormat as typeof prefs.numberFormat;
  if (Array.isArray(patch.dashboardSections)) prefs.dashboardSections = patch.dashboardSections as string[];
  if (patch.notifications && typeof patch.notifications === "object") {
    const n = patch.notifications as Record<string, unknown>;
    if (typeof n.inApp === "boolean") prefs.notifications.inApp = n.inApp;
    if (typeof n.email === "boolean") prefs.notifications.email = n.email;
  }
  req.user.markModified("preferences");
  await req.user.save();
  sendSuccess(res, { user: toPublicUser(req.user) });
}

async function deleteAccount(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const { password } = req.body as { password?: string };
  const { verifyPassword } = await import("../auth/password.js");
  const fresh = await User.findById(req.user.id).select("+passwordHash");
  if (!fresh) throw AppError.unauthorized();
  // Demo accounts must not be able to erase the shared demo dataset.
  if (fresh.email === "demo@nivesh.local") {
    throw AppError.forbidden("The shared demo account cannot be deleted");
  }
  if (password) {
    const ok = await verifyPassword(password, fresh.passwordHash);
    if (!ok) throw AppError.badRequest("Password is incorrect");
  } else {
    throw AppError.badRequest("Password is required to delete your account");
  }
  const userId = fresh._id;
  await Promise.all([
    Session.deleteMany({ userId }),
    Watchlist.deleteMany({ userId }),
    Portfolio.deleteMany({ userId }),
    Transaction.deleteMany({ userId }),
    PaperAccount.deleteMany({ userId }),
    PaperTrade.deleteMany({ userId }),
    Alert.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    SavedScreen.deleteMany({ userId }),
    ResearchNote.deleteMany({ userId }),
    RecentlyViewed.deleteMany({ userId }),
    User.deleteOne({ _id: userId }),
  ]);
  clearAuthCookies(res);
  sendSuccess(res, { deleted: true });
}

async function exportData(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const userId = req.user._id;
  const [watchlists, portfolios, transactions, notes, screens, alerts, paper, paperTrades] = await Promise.all([
    Watchlist.find({ userId }).lean(),
    Portfolio.find({ userId }).lean(),
    Transaction.find({ userId }).lean(),
    ResearchNote.find({ userId }).lean(),
    SavedScreen.find({ userId }).lean(),
    Alert.find({ userId }).lean(),
    PaperAccount.findOne({ userId }).lean(),
    PaperTrade.find({ userId }).lean(),
  ]);
  sendSuccess(res, {
    profile: toPublicUser(req.user),
    exportedAt: new Date().toISOString(),
    watchlists,
    portfolios,
    transactions,
    researchNotes: notes,
    savedScreens: screens,
    alerts,
    paperAccount: paper,
    paperTrades,
  });
}

const preferencesSchema = z
  .object({
    theme: z.enum(["dark", "light", "system"]).optional(),
    timezone: z.string().min(1).max(64).optional(),
    numberFormat: z.enum(["en-IN", "en-US"]).optional(),
    dashboardSections: z.array(z.string().min(1).max(40)).max(20).optional(),
    notifications: z
      .object({ inApp: z.boolean().optional(), email: z.boolean().optional() })
      .strict()
      .optional(),
  })
  .strict();

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get(
  "/me",
  asyncHandler(async (req, res) => sendSuccess(res, { user: toPublicUser(req.user!) })),
);
usersRouter.patch(
  "/me",
  validate({ body: z.object({ name: z.string().trim().min(2).max(80) }).strict() }),
  asyncHandler(updateProfile),
);
usersRouter.patch(
  "/me/preferences",
  validate({ body: preferencesSchema }),
  asyncHandler(updatePreferences),
);
usersRouter.get("/me/export", asyncHandler(exportData));
usersRouter.delete(
  "/me",
  validate({ body: z.object({ password: z.string().min(1).max(128) }).strict() }),
  asyncHandler(deleteAccount),
);
