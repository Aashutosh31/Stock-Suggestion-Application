import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.js";
import { validate, validatedQuery } from "../../middlewares/validate.js";
import { routeParam } from "../../utils/params.js";
import { findInstrument, INSTRUMENTS } from "../market/universe.js";
import { marketService } from "../market/market.service.js";
import { RecentlyViewed } from "../research/research.model.js";
import {
  bollinger,
  computeTechnicalSnapshot,
  ema,
  macd,
  rsi,
  sma,
} from "../market/indicators.js";

const HISTORY_INTERVALS = ["1d", "1wk", "1mo", "1m", "5m", "15m", "1h"] as const;
const HISTORY_RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"] as const;

export const stocksRouter = Router();

stocksRouter.get(
  "/universe",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, {
      instruments: INSTRUMENTS.map((i) => ({
        symbol: i.symbol,
        name: i.name,
        exchange: i.exchange,
        sector: i.sector ?? null,
        industry: i.industry ?? null,
        indices: i.indexMemberships ?? [],
      })),
    });
  }),
);

stocksRouter.get(
  "/compare",
  validate({ query: z.object({ symbols: z.string().trim().min(1).max(300) }) }),
  asyncHandler(async (req, res) => {
    const { symbols } = validatedQuery<{ symbols: string }>(req);
    const list = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (list.length < 2 || list.length > 6) throw AppError.badRequest("Compare requires 2 to 6 symbols");
    const rows = await Promise.all(
      list.map(async (symbol) => {
        if (!findInstrument(symbol)) throw AppError.badRequest(`Unknown instrument: ${symbol}`);
        const [quote, fundamentals, history] = await Promise.all([
          marketService.getQuote(symbol).catch(() => null),
          marketService.getFundamentals(symbol).catch(() => null),
          marketService.getHistory(symbol, "1y", "1d").catch(() => null),
        ]);
        const technical = history ? computeTechnicalSnapshot(history.candles) : null;
        return { symbol, name: findInstrument(symbol)?.name, quote, fundamentals, technical };
      }),
    );
    sendSuccess(res, { comparison: rows });
  }),
);

stocksRouter.get(
  "/:symbol",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const symbol = routeParam(req, "symbol").toUpperCase();
    const instrument = findInstrument(symbol);
    if (!instrument) throw AppError.notFound(`Instrument ${symbol} not found`);
    const [quote, profile, fundamentals] = await Promise.all([
      marketService.getQuote(symbol).catch(() => null),
      marketService.getProfile(symbol).catch(() => null),
      marketService.getFundamentals(symbol).catch(() => null),
    ]);
    if (req.user) {
      try {
        const userId = req.user._id;
        await RecentlyViewed.updateOne({ userId }, { $pull: { items: { symbol } } });
        await RecentlyViewed.updateOne(
          { userId },
          { $push: { items: { $each: [{ symbol, viewedAt: new Date() }], $position: 0, $slice: 20 } } },
          { upsert: true },
        );
      } catch {
        // Recording history is best-effort and must never fail the request.
      }
    }
    sendSuccess(res, {
      instrument,
      quote,
      profile,
      fundamentals,
      marketStatus: marketService.getMarketStatus(),
      source: marketService.providerInfo,
    });
  }),
);

stocksRouter.get(
  "/:symbol/history",
  validate({
    query: z.object({
      range: z.enum(HISTORY_RANGES).default("6mo"),
      interval: z.enum(HISTORY_INTERVALS).default("1d"),
    }),
  }),
  asyncHandler(async (req, res) => {
    const symbol = routeParam(req, "symbol").toUpperCase();
    if (!findInstrument(symbol)) throw AppError.notFound(`Instrument ${symbol} not found`);
    const { range, interval } = validatedQuery<{ range: (typeof HISTORY_RANGES)[number]; interval: (typeof HISTORY_INTERVALS)[number] }>(req);
    const history = await marketService.getHistory(symbol, range, interval);
    sendSuccess(res, { history });
  }),
);

stocksRouter.get(
  "/:symbol/indicators",
  validate({
    query: z.object({ range: z.enum(HISTORY_RANGES).default("1y"), interval: z.enum(HISTORY_INTERVALS).default("1d") }),
  }),
  asyncHandler(async (req, res) => {
    const symbol = routeParam(req, "symbol").toUpperCase();
    if (!findInstrument(symbol)) throw AppError.notFound(`Instrument ${symbol} not found`);
    const { range, interval } = validatedQuery<{ range: (typeof HISTORY_RANGES)[number]; interval: (typeof HISTORY_INTERVALS)[number] }>(req);
    const history = await marketService.getHistory(symbol, range, interval);
    const closes = history.candles.map((c) => c.close);
    const times = history.candles.map((c) => c.time);
    const m = macd(closes);
    const bb = bollinger(closes, 20, 2);
    const series = times.map((time, i) => ({
      time,
      sma20: sma(closes, 20)[i] ?? null,
      sma50: sma(closes, 50)[i] ?? null,
      sma200: sma(closes, 200)[i] ?? null,
      ema20: ema(closes, 20)[i] ?? null,
      rsi14: rsi(closes, 14)[i] ?? null,
      macd: m.macd[i] ?? null,
      macdSignal: m.signal[i] ?? null,
      macdHistogram: m.histogram[i] ?? null,
      bbUpper: bb.upper[i] ?? null,
      bbLower: bb.lower[i] ?? null,
    }));
    sendSuccess(res, {
      symbol,
      range,
      interval,
      series,
      snapshot: computeTechnicalSnapshot(history.candles),
    });
  }),
);

stocksRouter.get(
  "/:symbol/fundamentals",
  asyncHandler(async (req, res) => {
    const symbol = routeParam(req, "symbol").toUpperCase();
    if (!findInstrument(symbol)) throw AppError.notFound(`Instrument ${symbol} not found`);
    const fundamentals = await marketService.getFundamentals(symbol);
    sendSuccess(res, { fundamentals, source: marketService.providerInfo });
  }),
);

stocksRouter.get(
  "/:symbol/profile",
  asyncHandler(async (req, res) => {
    const symbol = routeParam(req, "symbol").toUpperCase();
    if (!findInstrument(symbol)) throw AppError.notFound(`Instrument ${symbol} not found`);
    const profile = await marketService.getProfile(symbol);
    sendSuccess(res, { profile, source: marketService.providerInfo });
  }),
);

stocksRouter.get(
  "/:symbol/news",
  asyncHandler(async (req, res) => {
    const symbol = routeParam(req, "symbol").toUpperCase();
    if (!findInstrument(symbol)) throw AppError.notFound(`Instrument ${symbol} not found`);
    const news = await marketService.getNews([symbol], 10);
    sendSuccess(res, { news, source: marketService.providerInfo });
  }),
);

stocksRouter.post(
  "/:symbol/view",
  requireAuth,
  asyncHandler(async (req, res) => {
    const symbol = routeParam(req, "symbol").toUpperCase();
    if (!findInstrument(symbol)) throw AppError.notFound(`Instrument ${symbol} not found`);
    await RecentlyViewed.updateOne({ userId: req.user!._id }, { $pull: { items: { symbol } } });
    await RecentlyViewed.updateOne(
      { userId: req.user!._id },
      { $push: { items: { $each: [{ symbol, viewedAt: new Date() }], $position: 0, $slice: 20 } } },
      { upsert: true },
    );
    sendSuccess(res, { recorded: true });
  }),
);
