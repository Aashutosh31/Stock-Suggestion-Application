import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.js";
import { validate, validatedQuery } from "../../middlewares/validate.js";
import { routeParam } from "../../utils/params.js";
import { marketService } from "../market/market.service.js";
import { metricAvailability, toMetrics } from "../market/metrics.js";
import { SavedScreen } from "../research/research.model.js";
import { runScreen, SCREEN_PRESETS, SORT_FIELDS, type ScreenFilters, type ScreenQuery } from "./screener.service.js";

const csvList = z
  .string()
  .max(400)
  .optional()
  .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined));

const num = z.coerce.number().finite().optional();

const filterSchema = z.object({
  search: z.string().trim().max(40).optional(),
  exchange: z.enum(["NSE", "BSE"]).optional(),
  sectors: csvList,
  industries: csvList,
  index: z.string().trim().max(40).optional(),
  priceMin: num,
  priceMax: num,
  marketCapMin: num,
  marketCapMax: num,
  peMin: num,
  peMax: num,
  pbMin: num,
  pbMax: num,
  roeMin: num,
  debtToEquityMax: num,
  dividendYieldMin: num,
  revenueGrowthMin: num,
  earningsGrowthMin: num,
  volumeMin: num,
  volumeRatioMin: num,
  return1mMin: num,
  return3mMin: num,
  return1yMin: num,
  rsiMin: num,
  rsiMax: num,
  volatilityMax: num,
  aboveSma50: z.enum(["true", "false"]).optional().transform((v) => (v === undefined ? undefined : v === "true")),
  aboveSma200: z.enum(["true", "false"]).optional().transform((v) => (v === undefined ? undefined : v === "true")),
  goldenCross: z.enum(["true", "false"]).optional().transform((v) => (v === undefined ? undefined : v === "true")),
  trend: z.enum(["up", "down", "sideways"]).optional(),
  excludeStale: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  sortBy: z.enum(SORT_FIELDS as [string, ...string[]]).default("marketCap"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  preset: z.string().trim().max(40).optional(),
});

function withPreset(query: z.infer<typeof filterSchema>): ScreenQuery {
  const { preset, ...rest } = query;
  const filters: ScreenFilters = rest as ScreenFilters;
  let sortBy: ScreenQuery["sortBy"] = rest.sortBy as ScreenQuery["sortBy"];
  let sortDir: ScreenQuery["sortDir"] = rest.sortDir as ScreenQuery["sortDir"];
  if (preset) {
    const found = SCREEN_PRESETS.find((p) => p.id === preset);
    if (!found) throw AppError.badRequest(`Unknown preset: ${preset}`);
    // Preset supplies baseline filters; explicit query params always win.
    const explicit = new Set(
      Object.entries(rest)
        .filter(([k, v]) => v !== undefined && k !== "sortBy" && k !== "sortDir" && k !== "page" && k !== "pageSize")
        .map(([k]) => k),
    );
    for (const [k, v] of Object.entries(found.filters)) {
      if (!explicit.has(k)) (filters as Record<string, unknown>)[k] = v;
    }
    sortBy = rest.sortBy === "marketCap" ? (found.sortBy as ScreenQuery["sortBy"]) : sortBy;
    sortDir = rest.sortDir === "desc" ? (found.sortDir as ScreenQuery["sortDir"]) : sortDir;
  }
  return {
    ...filters,
    sortBy,
    sortDir,
    page: rest.page,
    pageSize: rest.pageSize,
  };
}

export const screenerRouter = Router();

screenerRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, { presets: SCREEN_PRESETS });
  }),
);

screenerRouter.get(
  "/",
  validate({ query: filterSchema }),
  asyncHandler(async (req, res) => {
    const query = validatedQuery<z.infer<typeof filterSchema>>(req);
    const screenQuery = withPreset(query);
    const snapshot = await marketService.getUniverseSnapshot();
    const rows = snapshot.map(toMetrics).map((m) => ({ ...m, dataAvailability: metricAvailability(m) }));
    const result = runScreen(rows, screenQuery);
    sendSuccess(res, {
      ...result,
      appliedFilters: screenQuery,
      source: marketService.providerInfo,
      generatedAt: new Date().toISOString(),
    });
  }),
);

screenerRouter.get(
  "/export.csv",
  validate({ query: filterSchema }),
  asyncHandler(async (req, res) => {
    const query = validatedQuery<z.infer<typeof filterSchema>>(req);
    const screenQuery = { ...withPreset(query), page: 1, pageSize: 1000 };
    const snapshot = await marketService.getUniverseSnapshot();
    const rows = snapshot.map(toMetrics);
    const result = runScreen(rows, screenQuery);
    const columns: (keyof (typeof result.results)[number])[] = [
      "symbol", "name", "exchange", "sector", "price", "changePercent", "marketCap", "peRatio",
      "pbRatio", "roe", "dividendYield", "return1y", "rsi14", "volatility", "volumeRatio",
    ];
    const header = columns.join(",");
    const body = result.results
      .map((r) => columns.map((c) => formatCsv(r[c])).join(","))
      .join("\n");
    const generatedAt = new Date().toISOString();
    const csv = `# Nivesh Terminal screener export — source: ${marketService.providerInfo.id} — generated: ${generatedAt}\n# Data may be delayed or simulated. Not investment advice.\n${header}\n${body}\n`;
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("content-disposition", `attachment; filename="nivesh-screener-${generatedAt.slice(0, 10)}.csv"`);
    res.status(200).send(csv);
  }),
);

function formatCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

screenerRouter.get(
  "/saved",
  requireAuth,
  asyncHandler(async (req, res) => {
    const screens = await SavedScreen.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    sendSuccess(res, { screens });
  }),
);

screenerRouter.post(
  "/saved",
  requireAuth,
  validate({ body: z.object({ name: z.string().trim().min(1).max(60), filters: z.record(z.string(), z.unknown()) }) }),
  asyncHandler(async (req, res) => {
    const { name, filters } = req.body as { name: string; filters: Record<string, unknown> };
    const existing = await SavedScreen.findOne({ userId: req.user!._id, name });
    if (existing) {
      existing.filters = filters;
      await existing.save();
      sendSuccess(res, { screen: existing });
      return;
    }
    const screen = await SavedScreen.create({ userId: req.user!._id, name, filters });
    sendSuccess(res, { screen }, 201);
  }),
);

screenerRouter.delete(
  "/saved/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await SavedScreen.deleteOne({ _id: routeParam(req, "id"), userId: req.user!._id });
    sendSuccess(res, { deleted: true });
  }),
);

screenerRouter.get(
  "/meta",
  optionalAuth,
  asyncHandler(async (_req, res) => {
    const meta = marketService.meta();
    sendSuccess(res, { ...meta, sortFields: SORT_FIELDS });
  }),
);
