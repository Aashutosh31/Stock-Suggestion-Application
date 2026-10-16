import { describe, expect, it } from "vitest";
import {
  annualizedVolatility,
  bollinger,
  computeTechnicalSnapshot,
  ema,
  macd,
  maxDrawdown,
  percentChange,
  rsi,
  sma,
} from "../modules/market/indicators.js";
import type { Candle } from "../modules/market/types.js";

function candles(closes: number[]): Candle[] {
  return closes.map((close, i) => ({
    time: 1_600_000_000 + i * 86_400,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000 + i,
  }));
}

describe("sma", () => {
  it("computes a rolling average and leaves warmup null", () => {
    const out = sma([1, 2, 3, 4, 5], 3);
    expect(out.slice(0, 2)).toEqual([null, null]);
    expect(out[2]).toBeCloseTo(2);
    expect(out[4]).toBeCloseTo(4);
  });
});

describe("ema", () => {
  it("seeds with an SMA then applies the smoothing factor", () => {
    const out = ema([1, 2, 3, 4, 5, 6], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBeCloseTo(2);
    // k = 2/(3+1) = 0.5 → 4*0.5 + 2*0.5 = 3
    expect(out[3]).toBeCloseTo(3);
  });
});

describe("rsi", () => {
  it("returns 100 for a strictly rising series", () => {
    const values = Array.from({ length: 30 }, (_, i) => 100 + i);
    const out = rsi(values, 14);
    expect(out.at(-1)).toBeCloseTo(100);
  });

  it("is near 0 for a strictly falling series", () => {
    const values = Array.from({ length: 30 }, (_, i) => 100 - i);
    const out = rsi(values, 14);
    expect(out.at(-1)).toBeCloseTo(0, 0);
    expect(out.at(-1)!).toBeLessThan(1);
  });

  it("stays within 0..100 on mixed data", () => {
    const values = [44, 44.15, 44.09, 44.5, 44.2, 44.8, 45.1, 44.9, 45.6, 46, 45.7, 46.4, 46.9, 47.2, 46.8, 47.5];
    const value = rsi(values, 14).at(-1)!;
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(100);
  });
});

describe("macd", () => {
  it("produces aligned nullable series and a histogram", () => {
    const values = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 4) * 5);
    const out = macd(values);
    expect(out.macd).toHaveLength(values.length);
    expect(out.signal).toHaveLength(values.length);
    expect(out.histogram).toHaveLength(values.length);
    expect(out.macd.at(-1)).not.toBeNull();
  });
});

describe("bollinger", () => {
  it("keeps upper >= middle >= lower", () => {
    const values = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i / 3) * 4);
    const out = bollinger(values, 20, 2);
    const i = values.length - 1;
    expect(out.upper[i]!).toBeGreaterThanOrEqual(out.middle[i]!);
    expect(out.middle[i]!).toBeGreaterThanOrEqual(out.lower[i]!);
  });
});

describe("risk helpers", () => {
  it("computes percent change safely", () => {
    expect(percentChange(100, 110)).toBeCloseTo(10);
    expect(percentChange(0, 10)).toBeNull();
  });

  it("computes max drawdown as a negative percent", () => {
    const dd = maxDrawdown(candles([100, 120, 90, 110]));
    expect(dd!).toBeLessThan(0);
    expect(dd!).toBeCloseTo(-25);
  });

  it("annualises volatility", () => {
    const series = candles(Array.from({ length: 80 }, (_, i) => 100 + i * 0.5 + (i % 2 ? 2 : -2)));
    const vol = annualizedVolatility(series, 60);
    expect(vol).not.toBeNull();
    expect(vol!).toBeGreaterThan(0);
  });
});

describe("computeTechnicalSnapshot", () => {
  it("handles insufficient data without throwing", () => {
    const snap = computeTechnicalSnapshot(candles([100, 101, 102]));
    expect(snap.price).toBe(102);
    expect(snap.sma200).toBeNull();
    expect(snap.return1y).toBeNull();
  });

  it("classifies an uptrend when price > sma50 > sma200", () => {
    const series = candles(Array.from({ length: 260 }, (_, i) => 100 + i));
    const snap = computeTechnicalSnapshot(series);
    expect(snap.trend).toBe("up");
    expect(snap.return1y).not.toBeNull();
  });
});
