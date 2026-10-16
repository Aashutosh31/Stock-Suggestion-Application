import { describe, expect, it } from "vitest";
import { DEFAULT_WEIGHTS, scale, scoreInstrument } from "../modules/suggestions/scoring.js";
import type { InstrumentMetrics } from "../modules/market/metrics.js";

function metrics(overrides: Partial<InstrumentMetrics> = {}): InstrumentMetrics {
  return {
    symbol: "TEST", name: "Test Ltd", exchange: "NSE", sector: "IT", industry: "Services", indices: [],
    price: 100, changePercent: 1, marketState: "OPEN", stale: false,
    marketCap: 1e12, peRatio: 20, pbRatio: 3, eps: 5, roe: 18, roce: 20, debtToEquity: 0.5,
    dividendYield: 1.2, revenueGrowth: 12, earningsGrowth: 15, beta: 1, high52w: 130, low52w: 80,
    volume: 1_000_000, volumeRatio: 1.2, avgVolume20: 900_000, rsi14: 58, sma20: 98, sma50: 95, sma200: 90,
    aboveSma50: true, aboveSma200: true, goldenCross: true, return1m: 2, return3m: 9, return6m: 14,
    return1y: 25, volatility: 18, maxDrawdown: -10, trend: "up", distanceFromHigh: -5,
    ...overrides,
  };
}

describe("scale", () => {
  it("clamps and maps linearly", () => {
    expect(scale(5, 0, 10)).toBe(50);
    expect(scale(-1, 0, 10)).toBe(0);
    expect(scale(99, 0, 10)).toBe(100);
    expect(scale(null, 0, 10)).toBeNull();
  });
});

describe("scoreInstrument", () => {
  it("is deterministic for identical inputs", () => {
    const a = scoreInstrument(metrics(), 12);
    const b = scoreInstrument(metrics(), 12);
    expect(a).toEqual(b);
  });

  it("scores a strong profile higher than a weak one", () => {
    const strong = scoreInstrument(metrics(), 5);
    const weak = scoreInstrument(
      metrics({ peRatio: 70, pbRatio: 12, roe: 2, debtToEquity: 4, return1y: -30, return3m: -20, trend: "down", aboveSma50: false, aboveSma200: false, rsi14: 25, volatility: 55, maxDrawdown: -60 }),
      5,
    );
    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("renormalises over available weights instead of treating missing metrics as zero", () => {
    const sparse = scoreInstrument(
      metrics({ peRatio: null, pbRatio: null, roe: null, roce: null, dividendYield: null, revenueGrowth: null, earningsGrowth: null }),
      null,
    );
    expect(sparse.dataCompleteness).toBeLessThan(100);
    expect(sparse.components.find((c) => c.key === "valuation")?.score).toBeNull();
    expect(sparse.score).toBeGreaterThan(0);
  });

  it("surfaces concerns for overbought and over-leveraged names", () => {
    const result = scoreInstrument(metrics({ rsi14: 85, debtToEquity: 3 }), 5);
    expect(result.concerns.join(" ")).toMatch(/overbought|leverage/i);
  });

  it("lists measurable reasons and invalidation conditions", () => {
    const result = scoreInstrument(metrics(), 5);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.invalidation.length).toBeGreaterThan(0);
    expect(result.band).toBeTruthy();
  });

  it("uses all default weights summing to 1", () => {
    const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
