import { Router } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, validatedQuery } from "../../middlewares/validate.js";
import { generateSuggestions } from "./suggestions.service.js";
import { DEFAULT_WEIGHTS, WEIGHT_KEYS } from "./scoring.js";

const weightSchema = z.object(
  Object.fromEntries(WEIGHT_KEYS.map((k) => [k, z.coerce.number().min(0).max(1).optional()])) as Record<
    string,
    z.ZodOptional<z.ZodNumber>
  >,
);

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(15),
  minScore: z.coerce.number().min(0).max(100).default(0),
  sector: z.string().trim().max(60).optional(),
  exchange: z.enum(["NSE", "BSE"]).optional(),
  trend: z.enum(["up", "down", "sideways"]).optional(),
  includeStale: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  ai: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

export const suggestionsRouter = Router();

suggestionsRouter.get(
  "/weights",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, { defaults: DEFAULT_WEIGHTS });
  }),
);

suggestionsRouter.get(
  "/",
  validate({ query: querySchema }),
  asyncHandler(async (req, res) => {
    const q = validatedQuery<z.infer<typeof querySchema>>(req);
    const result = await generateSuggestions({ ...q, weights: undefined });
    sendSuccess(res, {
      ...result,
      disclaimer:
        "Analytical ranking generated from the listed metrics. Educational research only — not a buy/sell recommendation and no guarantee of returns.",
    });
  }),
);

suggestionsRouter.post(
  "/",
  requireAuth,
  validate({
    body: z.object({
      limit: z.coerce.number().int().min(1).max(50).default(15),
      minScore: z.coerce.number().min(0).max(100).default(0),
      sector: z.string().trim().max(60).optional(),
      exchange: z.enum(["NSE", "BSE"]).optional(),
      trend: z.enum(["up", "down", "sideways"]).optional(),
      includeStale: z.boolean().default(false),
      ai: z.boolean().default(false),
      weights: weightSchema.optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof querySchema> & { weights?: Record<string, number> };
    const result = await generateSuggestions({
      limit: body.limit,
      minScore: body.minScore,
      sector: body.sector,
      exchange: body.exchange,
      trend: body.trend,
      includeStale: body.includeStale,
      ai: body.ai,
      weights: body.weights,
    });
    sendSuccess(res, {
      ...result,
      disclaimer:
        "Custom-weighted analytical ranking. Educational research only — not a buy/sell recommendation and no guarantee of returns.",
    });
  }),
);
