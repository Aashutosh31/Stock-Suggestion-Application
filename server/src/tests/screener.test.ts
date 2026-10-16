import { describe, expect, it } from "vitest";
import { passesFilters, runScreen, sortMetrics, type ScreenQuery } from "../modules/screener/screener.service.js";
import { metricAvailability, type InstrumentMetrics } from "../modules/market/metrics.js";

function m(overrides: Partial<InstrumentMetrics> = {}): InstrumentMetrics {
  return {
    symbol: "AAA", name: "Alpha Ltd", exchange: "NSE", sector: "IT", industry: "Services", indices: [],
    price: 100, changePercent: 1, marketState: "OPEN", stale: false, marketCap: 1e11, peRatio: 20,
    pbRatio: 3, eps: 5, roe: 18, roce: 20, debtToEquity: 0.5, dividendYield: 1.2, revenueGrowth: 12,
    earningsGrowth: 15, beta: 1, high52w: 130, low52w: 80, volume: 1_000_000, volumeRatio: 1.2,
    avgVolume20: 900_000, rsi14: 58, sma20: 98, sma50: 95, sma200: 90, aboveSma50: true,
    aboveSma200: true, goldenCross: true, return1m: 2, return3m: 9, return6m: 14, return1y: 25,
    volatility: 18, maxDrawdown: -10, trend: "up", distanceFromHigh: -5,
    ...overrides,
  };
}

describe("screener filters", () => {
  it("excludes instruments missing a filtered metric", () => {
    expect(passesFilters(m({ peRatio: null }), { peMax: 30 })).toBe(false);
    expect(passesFilters(m({ peRatio: 20 }), { peMax: 30 })).toBe(true);
  });

  it("applies sector and exchange filters", () => {
    expect(passesFilters(m(), { sectors: ["Banking"] })).toBe(false);
    expect(passesFilters(m(), { sectors: ["IT"] })).toBe(true);
    expect(passesFilters(m(), { exchange: "BSE" })).toBe(false);
  });

  it("applies range filters inclusively", () => {
    expect(passesFilters(m({ price: 100 }), { priceMin: 100, priceMax: 200 })).toBe(true);
    expect(passesFilters(m({ price: 99 }), { priceMin: 100 })).toBe(false);
  });

  it("filters on technical booleans", () => {
    expect(passesFilters(m({ aboveSma200: false }), { aboveSma200: true })).toBe(false);
    expect(passesFilters(m(), { aboveSma50: true, goldenCross: true })).toBe(true);
  });

  it("excludes stale data when requested", () => {
    expect(passesFilters(m({ stale: true }), { excludeStale: true })).toBe(false);
    expect(passesFilters(m({ stale: true }), { excludeStale: false })).toBe(true);
  });
});

describe("sortMetrics", () => {
  it("sorts descending and keeps missing values last", () => {
    const rows = [m({ symbol: "A", peRatio: 10 }), m({ symbol: "B", peRatio: 40 }), m({ symbol: "C", peRatio: null })];
    const sorted = sortMetrics(rows, "peRatio", "desc");
    expect(sorted.map((r) => r.symbol)).toEqual(["B", "A", "C"]);
  });

  it("sorts symbols alphabetically", () => {
    const rows = [m({ symbol: "Z" }), m({ symbol: "A" })];
    expect(sortMetrics(rows, "symbol", "asc").map((r) => r.symbol)).toEqual(["A", "Z"]);
  });
});

describe("runScreen", () => {
  const query: ScreenQuery = { sortBy: "marketCap", sortDir: "desc", page: 1, pageSize: 10 };
  it("paginates results and reports totals", () => {
    const rows = Array.from({ length: 25 }, (_, i) => m({ symbol: `S${i}`, marketCap: i }));
    const result = runScreen(rows, { ...query, pageSize: 10 });
    expect(result.total).toBe(25);
    expect(result.results).toHaveLength(10);
    expect(result.totalPages).toBe(3);
  });
});

describe("metricAvailability", () => {
  it("reports 100 when all tracked metrics are present", () => {
    expect(metricAvailability(m())).toBe(100);
  });
  it("drops when metrics are missing", () => {
    expect(metricAvailability(m({ peRatio: null, roe: null }))).toBeLessThan(100);
  });
});
