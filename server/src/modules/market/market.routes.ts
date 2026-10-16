import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validatedQuery } from "../../middlewares/validate.js";
import { marketService } from "./market.service.js";
import { appCache } from "../../utils/cache.js";
import { isMailEnabled } from "../notifications/mail.service.js";

export const marketRouter = Router();

marketRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, marketService.getMarketStatus());
  }),
);

marketRouter.get(
  "/indices",
  asyncHandler(async (_req, res) => {
    const indices = await marketService.getIndices();
    sendSuccess(res, { indices });
  }),
);

marketRouter.get(
  "/meta",
  asyncHandler(async (_req, res) => {
    const provider = marketService.providerInfo;
    sendSuccess(res, {
      app: env.APP_NAME,
      provider,
      filters: {
        sectors: marketService.meta().sectors,
        industries: marketService.meta().industries,
        indices: marketService.meta().indices,
      },
      capabilities: {
        mail: isMailEnabled(),
        aiExplain: env.AI_EXPLAIN_ENABLED && Boolean(env.GROQ_API_KEY),
      },
      disclaimer:
        "Nivesh Terminal is an educational research tool. It is not investment advice and provides no guarantee of returns.",
    });
  }),
);

const searchSchema = z.object({
  q: z.string().trim().min(1).max(40),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

marketRouter.get(
  "/search",
  validate({ query: searchSchema }),
  asyncHandler(async (req, res) => {
    const { q, limit } = validatedQuery<z.infer<typeof searchSchema>>(req);
    const results = await marketService.search(q, limit);
    sendSuccess(res, { query: q, results });
  }),
);

const quotesSchema = z.object({
  symbols: z
    .string()
    .trim()
    .min(1)
    .max(1200)
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean)),
});

marketRouter.get(
  "/quotes",
  validate({ query: quotesSchema }),
  asyncHandler(async (req, res) => {
    const { symbols } = validatedQuery<z.infer<typeof quotesSchema>>(req);
    if (symbols.length > 50) {
      throw AppError.badRequest("No more than 50 symbols per request");
    }
    const quotes = await marketService.getQuotes(symbols);
    sendSuccess(res, { quotes });
  }),
);

marketRouter.get(
  "/news",
  validate({ query: z.object({ symbols: z.string().trim().max(300).optional(), limit: z.coerce.number().int().min(1).max(30).default(10) }) }),
  asyncHandler(async (req, res) => {
    const q = validatedQuery<{ symbols?: string; limit: number }>(req);
    const symbols = q.symbols ? q.symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) : undefined;
    const news = await marketService.getNews(symbols, q.limit);
    sendSuccess(res, { news, source: marketService.providerInfo });
  }),
);

marketRouter.get(
  "/provider/health",
  asyncHandler(async (_req, res) => {
    const health = await marketService.health();
    sendSuccess(res, { health, cache: appCache.stats() });
  }),
);
