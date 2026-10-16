import { Router } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { PaperTrade } from "./paper.model.js";
import * as service from "./paper.service.js";

export const paperRouter = Router();
paperRouter.use(requireAuth);

paperRouter.get(
  "/account",
  asyncHandler(async (req, res) => {
    const summary = await service.portfolioSummary(req.user!._id);
    sendSuccess(res, summary);
  }),
);

paperRouter.patch(
  "/config",
  validate({
    body: z.object({
      commissionPercent: z.coerce.number().min(0).max(5).optional(),
      flatFee: z.coerce.number().min(0).max(1000).optional(),
      slippagePercent: z.coerce.number().min(0).max(5).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const account = await service.updateConfig(req.user!._id, req.body as never);
    sendSuccess(res, { config: account.config });
  }),
);

paperRouter.post(
  "/reset",
  validate({
    body: z.object({ startingCash: z.coerce.number().positive().max(1_000_000_000).default(1_000_000) }),
  }),
  asyncHandler(async (req, res) => {
    const { startingCash } = req.body as { startingCash: number };
    const account = await service.resetAccount(req.user!._id, startingCash);
    sendSuccess(res, { reset: true, cash: account.cash, startingCash: account.startingCash });
  }),
);

paperRouter.post(
  "/orders",
  validate({
    body: z.object({
      symbol: z.string().trim().min(1).max(32),
      side: z.enum(["buy", "sell"]),
      quantity: z.coerce.number().positive().max(1_000_000),
    }),
  }),
  asyncHandler(async (req, res) => {
    const result = await service.placeOrder(req.user!._id, req.body as never);
    sendSuccess(res, { trade: result.trade, cash: result.cash }, 201);
  }),
);

paperRouter.get(
  "/trades",
  asyncHandler(async (req, res) => {
    const trades = await PaperTrade.find({ userId: req.user!._id }).sort({ tradedAt: -1 }).limit(500);
    sendSuccess(res, { trades });
  }),
);
