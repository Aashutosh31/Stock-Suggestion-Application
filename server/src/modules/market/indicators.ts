import type { Candle } from "./types.js";

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= period) sum -= values[i - period]!;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length === 0) return out;
  const k = 2 / (period + 1);
  let prev: number | null = null;
  let seedSum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      seedSum += values[i]!;
      continue;
    }
    if (i === period - 1) {
      seedSum += values[i]!;
      prev = seedSum / period;
      out[i] = prev;
      continue;
    }
    prev = values[i]! * k + (prev as number) * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder's RSI. Returns values in [0,100]; null until enough data. */
export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i]! - values[i - 1]!;
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i]! - values[i - 1]!;
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export interface MacdResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine: (number | null)[] = values.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i]! - emaSlow[i]! : null,
  );
  const defined = macdLine.map((v) => v ?? 0);
  const firstIndex = macdLine.findIndex((v) => v !== null);
  const signalFull = ema(defined, signalPeriod);
  const signalLine = signalFull.map((v, i) => (i < firstIndex ? null : v));
  const histogram = macdLine.map((v, i) =>
    v !== null && signalLine[i] !== null ? v - (signalLine[i] as number) : null,
  );
  return { macd: macdLine, signal: signalLine, histogram };
}

export interface BollingerResult {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
}

export function bollinger(values: number[], period = 20, mult = 2): BollingerResult {
  const middle = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    const mean = middle[i];
    if (mean === null || mean === undefined) continue;
    const variance = window.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + mult * sd;
    lower[i] = mean - mult * sd;
  }
  return { middle, upper, lower };
}

export function percentChange(from: number, to: number): number | null {
  if (!Number.isFinite(from) || from === 0) return null;
  return ((to - from) / from) * 100;
}

export function returnsOverLookback(candles: Candle[], lookback: number): number | null {
  if (candles.length < lookback + 1) return null;
  const latest = candles.at(-1)!;
  const past = candles.at(-1 - lookback)!;
  return percentChange(past.close, latest.close);
}

export function annualizedVolatility(candles: Candle[], window = 60): number | null {
  if (candles.length < 3) return null;
  const slice = candles.slice(-Math.min(window, candles.length));
  const rets: number[] = [];
  for (let i = 1; i < slice.length; i++) {
    const r = percentChange(slice[i - 1]!.close, slice[i]!.close);
    if (r !== null) rets.push(r);
  }
  if (rets.length < 2) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

export function maxDrawdown(candles: Candle[]): number | null {
  if (candles.length < 2) return null;
  let peak = candles[0]!.close;
  let maxDd = 0;
  for (const c of candles) {
    if (c.close > peak) peak = c.close;
    const dd = (c.close - peak) / peak;
    if (dd < maxDd) maxDd = dd;
  }
  return maxDd * 100;
}

export interface TechnicalSnapshot {
  price: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bbUpper: number | null;
  bbLower: number | null;
  bbMiddle: number | null;
  return1m: number | null;
  return3m: number | null;
  return6m: number | null;
  return1y: number | null;
  volatility: number | null;
  maxDrawdown: number | null;
  avgVolume20: number | null;
  volumeRatio: number | null;
  trend: "up" | "down" | "sideways";
}

export function computeTechnicalSnapshot(candles: Candle[]): TechnicalSnapshot {
  const closes = candles.map((c) => c.close);
  const last = <T>(arr: T[]): T | null => (arr.length ? arr[arr.length - 1]! : null);
  const price = last(closes);
  const n = closes.length;

  const sma20 = last(sma(closes, 20));
  const sma50 = last(sma(closes, 50));
  const sma200 = last(sma(closes, 200));
  const ema20 = last(ema(closes, 20));
  const rsi14 = last(rsi(closes, 14));
  const m = macd(closes);
  const bb = bollinger(closes, 20, 2);

  const volWindow = candles.slice(-Math.min(20, n));
  const avgVolume20 =
    volWindow.length > 0 ? volWindow.reduce((a, c) => a + c.volume, 0) / volWindow.length : null;
  const latestVolume = candles.at(-1)?.volume ?? null;
  const volumeRatio = avgVolume20 && latestVolume ? latestVolume / avgVolume20 : null;

  let trend: "up" | "down" | "sideways" = "sideways";
  if (price !== null && sma50 !== null && sma200 !== null) {
    if (price > sma50 && sma50 > sma200) trend = "up";
    else if (price < sma50 && sma50 < sma200) trend = "down";
  } else if (price !== null && sma20 !== null) {
    trend = price > sma20 ? "up" : "down";
  }

  return {
    price,
    sma20,
    sma50,
    sma200,
    ema20,
    rsi14,
    macd: last(m.macd),
    macdSignal: last(m.signal),
    macdHistogram: last(m.histogram),
    bbUpper: last(bb.upper),
    bbLower: last(bb.lower),
    bbMiddle: last(bb.middle),
    return1m: returnsOverLookback(candles, 21),
    return3m: returnsOverLookback(candles, 63),
    return6m: returnsOverLookback(candles, 126),
    return1y: returnsOverLookback(candles, 252),
    volatility: annualizedVolatility(candles, 60),
    maxDrawdown: maxDrawdown(candles.slice(-252)),
    avgVolume20,
    volumeRatio,
    trend,
  };
}
