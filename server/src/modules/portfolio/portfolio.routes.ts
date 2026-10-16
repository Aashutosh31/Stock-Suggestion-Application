import { Router } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { routeParam } from "../../utils/params.js";
import * as service from "./portfolio.service.js";

const symbolSchema = z.string().trim().min(1).max(32);

export const portfolioRouter = Router();
portfolioRouter.use(requireAuth);

portfolioRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const portfolios = await service.listPortfolios(req.user!._id);
    const summaries = await Promise.all(
      portfolios.map(async (p) => {
        const computation = await service.getComputation(req.user!._id, p.id);
        return {
          id: p.id,
          name: p.name,
          isDefault: p.isDefault,
          baseCurrency: p.baseCurrency,
          notes: p.notes ?? null,
          totals: computation.totals,
          createdAt: p.createdAt.toISOString(),
        };
      }),
    );
    sendSuccess(res, { portfolios: summaries });
  }),
);

portfolioRouter.post(
  "/",
  validate({ body: z.object({ name: z.string().trim().min(1).max(60) }) }),
  asyncHandler(async (req, res) => {
    const p = await service.createPortfolio(req.user!._id, (req.body as { name: string }).name);
    sendSuccess(res, { portfolio: { id: p.id, name: p.name } }, 201);
  }),
);

portfolioRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await service.deletePortfolio(req.user!._id, routeParam(req, "id"));
    sendSuccess(res, { deleted: true });
  }),
);

portfolioRouter.get(
  "/:id/holdings",
  asyncHandler(async (req, res) => {
    const computation = await service.getComputation(req.user!._id, routeParam(req, "id"));
    sendSuccess(res, { ...computation });
  }),
);

portfolioRouter.get(
  "/:id/allocation",
  asyncHandler(async (req, res) => {
    const computation = await service.getComputation(req.user!._id, routeParam(req, "id"));
    const bySector = new Map<string, number>();
    const byInstrument = new Map<string, number>();
    let total = 0;
    for (const h of computation.holdings) {
      const value = h.currentValue ?? h.investedValue;
      total += value;
      const sector = h.sector ?? "Unclassified";
      bySector.set(sector, (bySector.get(sector) ?? 0) + value);
      byInstrument.set(h.symbol, (byInstrument.get(h.symbol) ?? 0) + value);
    }
    const toArray = (m: Map<string, number>) =>
      [...m.entries()]
        .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100, percent: total ? Math.round((value / total) * 10000) / 100 : 0 }))
        .sort((a, b) => b.value - a.value);
    sendSuccess(res, { total: Math.round(total * 100) / 100, bySector: toArray(bySector), byInstrument: toArray(byInstrument) });
  }),
);

portfolioRouter.get(
  "/:id/transactions",
  asyncHandler(async (req, res) => {
    const txs = await service.listTransactions(req.user!._id, routeParam(req, "id"));
    sendSuccess(res, { transactions: txs });
  }),
);

portfolioRouter.post(
  "/:id/transactions",
  validate({
    body: z.object({
      symbol: symbolSchema,
      side: z.enum(["buy", "sell"]),
      quantity: z.coerce.number().positive().max(1_000_000),
      price: z.coerce.number().nonnegative().max(10_000_000),
      fees: z.coerce.number().nonnegative().max(1_000_000).default(0),
      tradedAt: z.coerce.date(),
      notes: z.string().max(1000).nullable().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const tx = await service.addTransaction(req.user!._id, routeParam(req, "id"), req.body as never);
    sendSuccess(res, { transaction: tx }, 201);
  }),
);

portfolioRouter.patch(
  "/transactions/:transactionId",
  validate({
    body: z.object({
      quantity: z.coerce.number().positive().max(1_000_000).optional(),
      price: z.coerce.number().nonnegative().max(10_000_000).optional(),
      fees: z.coerce.number().nonnegative().max(1_000_000).optional(),
      tradedAt: z.coerce.date().optional(),
      notes: z.string().max(1000).nullable().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const tx = await service.updateTransaction(req.user!._id, routeParam(req, "transactionId"), req.body as never);
    sendSuccess(res, { transaction: tx });
  }),
);

portfolioRouter.delete(
  "/transactions/:transactionId",
  asyncHandler(async (req, res) => {
    await service.deleteTransaction(req.user!._id, routeParam(req, "transactionId"));
    sendSuccess(res, { deleted: true });
  }),
);
