import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, validatedQuery } from "../../middlewares/validate.js";
import { routeParam } from "../../utils/params.js";
import { findInstrument } from "../market/universe.js";
import { marketService } from "../market/market.service.js";
import { RecentlyViewed, ResearchNote } from "./research.model.js";

export const researchRouter = Router();
researchRouter.use(requireAuth);

researchRouter.get(
  "/recently-viewed",
  asyncHandler(async (req, res) => {
    const doc = await RecentlyViewed.findOne({ userId: req.user!._id });
    const items = doc?.items.slice(0, 20) ?? [];
    const quotes = await marketService.getQuotes(items.map((i) => i.symbol));
    const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
    sendSuccess(res, {
      items: items.map((i) => ({
        symbol: i.symbol,
        name: findInstrument(i.symbol)?.name ?? i.symbol,
        viewedAt: i.viewedAt.toISOString(),
        quote: bySymbol.get(i.symbol) ?? null,
      })),
    });
  }),
);

researchRouter.get(
  "/notes",
  validate({ query: z.object({ symbol: z.string().trim().max(32).optional() }) }),
  asyncHandler(async (req, res) => {
    const { symbol } = validatedQuery<{ symbol?: string }>(req);
    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (symbol) filter.symbol = symbol.toUpperCase();
    const notes = await ResearchNote.find(filter).sort({ createdAt: -1 }).limit(200);
    sendSuccess(res, { notes });
  }),
);

researchRouter.post(
  "/notes",
  validate({
    body: z.object({
      symbol: z.string().trim().min(1).max(32),
      title: z.string().trim().min(1).max(120),
      content: z.string().min(1).max(8000),
    }),
  }),
  asyncHandler(async (req, res) => {
    const body = req.body as { symbol: string; title: string; content: string };
    const symbol = body.symbol.toUpperCase();
    if (!findInstrument(symbol)) throw AppError.badRequest(`Unknown instrument: ${body.symbol}`);
    const note = await ResearchNote.create({ userId: req.user!._id, symbol, title: body.title, content: body.content });
    sendSuccess(res, { note }, 201);
  }),
);

researchRouter.patch(
  "/notes/:id",
  validate({
    body: z.object({ title: z.string().trim().min(1).max(120).optional(), content: z.string().min(1).max(8000).optional() }),
  }),
  asyncHandler(async (req, res) => {
    const note = await ResearchNote.findOneAndUpdate(
      { _id: routeParam(req, "id"), userId: req.user!._id },
      { $set: req.body as Record<string, unknown> },
      { returnDocument: "after" },
    );
    if (!note) throw AppError.notFound("Note not found");
    sendSuccess(res, { note });
  }),
);

researchRouter.delete(
  "/notes/:id",
  asyncHandler(async (req, res) => {
    await ResearchNote.deleteOne({ _id: routeParam(req, "id"), userId: req.user!._id });
    sendSuccess(res, { deleted: true });
  }),
);
