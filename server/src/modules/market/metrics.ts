import type { UniverseSnapshotRow } from "./market.service.js";

export interface InstrumentMetrics {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  indices: string[];
  price: number | null;
  changePercent: number | null;
  marketState: string | null;
  stale: boolean;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  eps: number | null;
  roe: number | null;
  roce: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  beta: number | null;
  high52w: number | null;
  low52w: number | null;
  volume: number | null;
  volumeRatio: number | null;
  avgVolume20: number | null;
  rsi14: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  aboveSma50: boolean | null;
  aboveSma200: boolean | null;
  goldenCross: boolean | null;
  return1m: number | null;
  return3m: number | null;
  return6m: number | null;
  return1y: number | null;
  volatility: number | null;
  maxDrawdown: number | null;
  trend: string | null;
  /** Percent distance from 52-week high (<=0). */
  distanceFromHigh: number | null;
}

export function toMetrics(row: UniverseSnapshotRow): InstrumentMetrics {
  const q = row.quote;
  const f = row.fundamentals;
  const t = row.technical;
  const price = q?.price ?? t?.price ?? null;
  return {
    symbol: row.symbol,
    name: row.name,
    exchange: row.exchange,
    sector: row.sector,
    industry: row.industry,
    indices: row.indices,
    price,
    changePercent: q?.changePercent ?? null,
    marketState: q?.marketState ?? null,
    stale: q?.stale ?? true,
    marketCap: f?.marketCap ?? null,
    peRatio: f?.peRatio ?? null,
    pbRatio: f?.pbRatio ?? null,
    eps: f?.eps ?? null,
    roe: f?.roe ?? null,
    roce: f?.roce ?? null,
    debtToEquity: f?.debtToEquity ?? null,
    dividendYield: f?.dividendYield ?? null,
    revenueGrowth: f?.revenueGrowth ?? null,
    earningsGrowth: f?.earningsGrowth ?? null,
    beta: f?.beta ?? null,
    high52w: f?.high52w ?? (t as { high52w?: number | null } | null)?.high52w ?? null,
    low52w: f?.low52w ?? null,
    volume: q?.volume ?? null,
    volumeRatio: t?.volumeRatio ?? null,
    avgVolume20: t?.avgVolume20 ?? null,
    rsi14: t?.rsi14 ?? null,
    sma20: t?.sma20 ?? null,
    sma50: t?.sma50 ?? null,
    sma200: t?.sma200 ?? null,
    aboveSma50: price !== null && t?.sma50 != null ? price > t.sma50 : null,
    aboveSma200: price !== null && t?.sma200 != null ? price > t.sma200 : null,
    goldenCross: t?.sma50 != null && t?.sma200 != null ? t.sma50 > t.sma200 : null,
    return1m: t?.return1m ?? null,
    return3m: t?.return3m ?? null,
    return6m: t?.return6m ?? null,
    return1y: t?.return1y ?? null,
    volatility: t?.volatility ?? null,
    maxDrawdown: t?.maxDrawdown ?? null,
    trend: t?.trend ?? null,
    distanceFromHigh:
      price !== null && f?.high52w ? ((price - f.high52w) / f.high52w) * 100 : null,
  };
}

export function metricAvailability(m: InstrumentMetrics): number {
  const fields: (number | boolean | string | null)[] = [
    m.price, m.changePercent, m.marketCap, m.peRatio, m.pbRatio, m.roe, m.debtToEquity,
    m.dividendYield, m.revenueGrowth, m.volume, m.rsi14, m.sma50, m.sma200, m.return1y,
    m.volatility, m.maxDrawdown,
  ];
  const present = fields.filter((v) => v !== null && v !== undefined).length;
  return Math.round((present / fields.length) * 100);
}
