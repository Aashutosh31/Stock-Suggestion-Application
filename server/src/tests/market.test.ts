import { describe, expect, it } from "vitest";
import { DemoMarketDataProvider } from "../modules/market/providers/demo.provider.js";
import { findInstrument, INSTRUMENTS } from "../modules/market/universe.js";
import { getMarketState, isTradingDay } from "../modules/market/marketCalendar.js";
import { toMetrics } from "../modules/market/metrics.js";

const FIXED = new Date("2026-06-10T06:00:00.000Z"); // 11:30 IST, a Wednesday
const provider = new DemoMarketDataProvider(() => FIXED);

describe("demo provider", () => {
  it("returns deterministic quotes for the same instant", async () => {
    const a = await provider.getQuote("RELIANCE");
    const b = await provider.getQuote("RELIANCE");
    expect(a).toEqual(b);
    expect(a?.source).toBe("demo");
    expect(a?.price).toBeGreaterThan(0);
  });

  it("produces a normalized history series in ascending time order", async () => {
    const history = await provider.getHistory("TCS", "6mo", "1d");
    expect(history.candles.length).toBeGreaterThan(50);
    const times = history.candles.map((c) => c.time);
    expect([...times].sort((x, y) => x - y)).toEqual(times);
    for (const c of history.candles) {
      expect(c.high).toBeGreaterThanOrEqual(c.low);
      expect(c.high).toBeGreaterThanOrEqual(c.close);
      expect(c.low).toBeLessThanOrEqual(c.close);
    }
  });

  it("filters search results and ranks exact matches first", async () => {
    const results = await provider.searchInstruments("reliance", 5);
    expect(results[0]?.symbol).toBe("RELIANCE");
  });

  it("returns null for an unknown instrument rather than fabricating data", async () => {
    expect(await provider.getQuote("NOT_A_REAL_TICKER")).toBeNull();
  });

  it("reports its own health as demo", async () => {
    const health = await provider.health();
    expect(health.demo).toBe(true);
    expect(health.status).toBe("ok");
  });
});

describe("universe", () => {
  it("has unique symbols and valid metadata", () => {
    const symbols = INSTRUMENTS.map((i) => i.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
    for (const inst of INSTRUMENTS) {
      expect(inst.exchange).toMatch(/NSE|BSE/);
      expect(inst.currency).toBe("INR");
      expect(inst.providerSymbol.length).toBeGreaterThan(0);
    }
  });

  it("finds instruments case-insensitively", () => {
    expect(findInstrument("reliance")?.name).toContain("Reliance");
    expect(findInstrument("nope")).toBeUndefined();
  });
});

describe("market calendar", () => {
  it("marks weekends as non-trading", () => {
    expect(isTradingDay(new Date("2026-06-13T06:00:00.000Z"))).toBe(false); // Saturday
  });
  it("reports OPEN during IST sessions and CLOSED otherwise", () => {
    expect(getMarketState(new Date("2026-06-10T06:00:00.000Z"))).toBe("OPEN");
    expect(getMarketState(new Date("2026-06-10T14:00:00.000Z"))).toBe("CLOSED");
  });
});

describe("metrics normalization", () => {
  it("maps a snapshot row to flat metrics with derived booleans", () => {
    const metrics = toMetrics({
      symbol: "TEST",
      name: "Test Ltd",
      exchange: "NSE",
      sector: "Energy",
      industry: "Oil",
      indices: ["NIFTY50"],
      quote: {
        symbol: "TEST", exchange: "NSE", price: 120, change: 2, changePercent: 1.7, previousClose: 118,
        open: 118, high: 121, low: 117, volume: 1000, currency: "INR", marketState: "OPEN",
        timestamp: FIXED.toISOString(), source: "demo", delayed: false, stale: false,
      },
      fundamentals: null,
      technical: {
        price: 120, sma20: 115, sma50: 110, sma200: 100, ema20: 116, rsi14: 60, macd: 1, macdSignal: 0.5,
        macdHistogram: 0.5, bbUpper: 125, bbLower: 105, bbMiddle: 115, return1m: 5, return3m: 8,
        return6m: 12, return1y: 20, volatility: 18, maxDrawdown: -12, avgVolume20: 900, volumeRatio: 1.1, trend: "up",
      },
    });
    expect(metrics.aboveSma50).toBe(true);
    expect(metrics.aboveSma200).toBe(true);
    expect(metrics.goldenCross).toBe(true);
    expect(metrics.stale).toBe(false);
  });
});
