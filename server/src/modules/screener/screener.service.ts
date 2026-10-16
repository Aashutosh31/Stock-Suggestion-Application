import type { InstrumentMetrics } from "../market/metrics.js";

export interface ScreenFilters {
  search?: string;
  exchange?: string;
  sectors?: string[];
  industries?: string[];
  index?: string;
  priceMin?: number;
  priceMax?: number;
  marketCapMin?: number;
  marketCapMax?: number;
  peMin?: number;
  peMax?: number;
  pbMin?: number;
  pbMax?: number;
  roeMin?: number;
  debtToEquityMax?: number;
  dividendYieldMin?: number;
  revenueGrowthMin?: number;
  earningsGrowthMin?: number;
  volumeMin?: number;
  volumeRatioMin?: number;
  return1mMin?: number;
  return3mMin?: number;
  return1yMin?: number;
  rsiMin?: number;
  rsiMax?: number;
  volatilityMax?: number;
  aboveSma50?: boolean;
  aboveSma200?: boolean;
  goldenCross?: boolean;
  trend?: "up" | "down" | "sideways";
  excludeStale?: boolean;
}

export type SortField =
  | "symbol"
  | "price"
  | "changePercent"
  | "marketCap"
  | "peRatio"
  | "pbRatio"
  | "roe"
  | "dividendYield"
  | "volume"
  | "volatility"
  | "return1m"
  | "return3m"
  | "return6m"
  | "return1y"
  | "rsi14";

export interface ScreenQuery extends ScreenFilters {
  sortBy: SortField;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export const SORT_FIELDS: SortField[] = [
  "symbol", "price", "changePercent", "marketCap", "peRatio", "pbRatio", "roe",
  "dividendYield", "volume", "volatility", "return1m", "return3m", "return6m", "return1y", "rsi14",
];

function inRange(value: number | null, min?: number, max?: number): boolean {
  if (min === undefined && max === undefined) return true;
  if (value === null || value === undefined || !Number.isFinite(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

export function passesFilters(m: InstrumentMetrics, f: ScreenFilters): boolean {
  if (f.excludeStale && m.stale) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    if (!m.symbol.toLowerCase().includes(q) && !m.name.toLowerCase().includes(q)) return false;
  }
  if (f.exchange && m.exchange !== f.exchange) return false;
  if (f.sectors?.length && (!m.sector || !f.sectors.includes(m.sector))) return false;
  if (f.industries?.length && (!m.industry || !f.industries.includes(m.industry))) return false;
  if (f.index && !m.indices.includes(f.index)) return false;
  if (!inRange(m.price, f.priceMin, f.priceMax)) return false;
  if (!inRange(m.marketCap, f.marketCapMin, f.marketCapMax)) return false;
  if (!inRange(m.peRatio, f.peMin, f.peMax)) return false;
  if (!inRange(m.pbRatio, f.pbMin, f.pbMax)) return false;
  if (f.roeMin !== undefined && !(m.roe !== null && m.roe >= f.roeMin)) return false;
  if (f.debtToEquityMax !== undefined && !(m.debtToEquity !== null && m.debtToEquity <= f.debtToEquityMax)) return false;
  if (f.dividendYieldMin !== undefined && !(m.dividendYield !== null && m.dividendYield >= f.dividendYieldMin)) return false;
  if (f.revenueGrowthMin !== undefined && !(m.revenueGrowth !== null && m.revenueGrowth >= f.revenueGrowthMin)) return false;
  if (f.earningsGrowthMin !== undefined && !(m.earningsGrowth !== null && m.earningsGrowth >= f.earningsGrowthMin)) return false;
  if (f.volumeMin !== undefined && !(m.volume !== null && m.volume >= f.volumeMin)) return false;
  if (f.volumeRatioMin !== undefined && !(m.volumeRatio !== null && m.volumeRatio >= f.volumeRatioMin)) return false;
  if (f.return1mMin !== undefined && !(m.return1m !== null && m.return1m >= f.return1mMin)) return false;
  if (f.return3mMin !== undefined && !(m.return3m !== null && m.return3m >= f.return3mMin)) return false;
  if (f.return1yMin !== undefined && !(m.return1y !== null && m.return1y >= f.return1yMin)) return false;
  if (!inRange(m.rsi14, f.rsiMin, f.rsiMax)) return false;
  if (f.volatilityMax !== undefined && !(m.volatility !== null && m.volatility <= f.volatilityMax)) return false;
  if (f.aboveSma50 !== undefined && m.aboveSma50 !== f.aboveSma50) return false;
  if (f.aboveSma200 !== undefined && m.aboveSma200 !== f.aboveSma200) return false;
  if (f.goldenCross !== undefined && m.goldenCross !== f.goldenCross) return false;
  if (f.trend && m.trend !== f.trend) return false;
  return true;
}

export function sortMetrics(rows: InstrumentMetrics[], field: SortField, dir: "asc" | "desc"): InstrumentMetrics[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (field === "symbol") return a.symbol.localeCompare(b.symbol) * factor;
    const av = a[field] as number | null;
    const bv = b[field] as number | null;
    if (av === null && bv === null) return a.symbol.localeCompare(b.symbol);
    if (av === null) return 1; // missing values always last
    if (bv === null) return -1;
    return (av - bv) * factor;
  });
}

export interface ScreenPreset {
  id: string;
  name: string;
  description: string;
  filters: ScreenFilters;
  sortBy: SortField;
  sortDir: "asc" | "desc";
}

/**
 * Predefined analytical screens. These are transparent metric filters and are
 * NOT predictions of future performance.
 */
export const SCREEN_PRESETS: ScreenPreset[] = [
  {
    id: "momentum",
    name: "Momentum candidates",
    description: "Positive 3-month return, price above SMA-50, RSI in a constructive band, above-average volume.",
    filters: { return3mMin: 8, aboveSma50: true, rsiMin: 50, rsiMax: 75, volumeRatioMin: 1 },
    sortBy: "return3m",
    sortDir: "desc",
  },
  {
    id: "value",
    name: "Value-oriented candidates",
    description: "Lower P/E and P/B with a positive dividend yield.",
    filters: { peMin: 0, peMax: 25, pbMax: 3, dividendYieldMin: 1 },
    sortBy: "peRatio",
    sortDir: "asc",
  },
  {
    id: "quality",
    name: "Quality-focused companies",
    description: "High return on equity, low leverage, positive earnings growth.",
    filters: { roeMin: 15, debtToEquityMax: 1, earningsGrowthMin: 5 },
    sortBy: "roe",
    sortDir: "desc",
  },
  {
    id: "high-volume",
    name: "High-volume instruments",
    description: "Traded volume materially above the 20-day average.",
    filters: { volumeRatioMin: 1.5 },
    sortBy: "volume",
    sortDir: "desc",
  },
  {
    id: "breakout",
    name: "Potential trend breakouts",
    description: "Trading near 52-week highs while in an uptrend with volume expansion.",
    filters: { aboveSma200: true, volumeRatioMin: 1.2, rsiMin: 55 },
    sortBy: "return3m",
    sortDir: "desc",
  },
  {
    id: "low-volatility",
    name: "Lower-volatility candidates",
    description: "Annualised volatility under 22% with a contained maximum drawdown.",
    filters: { volatilityMax: 22 },
    sortBy: "volatility",
    sortDir: "asc",
  },
  {
    id: "dividend",
    name: "Dividend-oriented candidates",
    description: "Dividend yield of at least 2%.",
    filters: { dividendYieldMin: 2 },
    sortBy: "dividendYield",
    sortDir: "desc",
  },
];

export function runScreen(rows: InstrumentMetrics[], query: ScreenQuery) {
  const filtered = rows.filter((r) => passesFilters(r, query));
  const sorted = sortMetrics(filtered, query.sortBy, query.sortDir);
  const total = sorted.length;
  const start = (query.page - 1) * query.pageSize;
  const pageItems = sorted.slice(start, start + query.pageSize);
  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    results: pageItems,
  };
}
