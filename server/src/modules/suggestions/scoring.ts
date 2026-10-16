import type { InstrumentMetrics } from "../market/metrics.js";

export interface ScoringWeights {
  momentum: number;
  technical: number;
  valuation: number;
  quality: number;
  growth: number;
  liquidity: number;
  risk: number;
  relative: number;
}

/**
 * Default weights (must sum to 1.0). These are intentionally transparent and
 * configurable per request. They encode a research tilt, not investment advice.
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  momentum: 0.2,
  technical: 0.15,
  valuation: 0.15,
  quality: 0.15,
  growth: 0.1,
  liquidity: 0.05,
  risk: 0.1,
  relative: 0.1,
};

export const WEIGHT_KEYS = Object.keys(DEFAULT_WEIGHTS) as (keyof ScoringWeights)[];

/** Map a value onto 0..100 across a [worst, best] linear band, clamped. */
export function scale(value: number | null, worst: number, best: number): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (worst === best) return 50;
  const t = (value - worst) / (best - worst);
  return Math.max(0, Math.min(100, t * 100));
}

export interface ComponentResult {
  key: keyof ScoringWeights;
  label: string;
  score: number | null;
  weight: number;
  contribution: number;
  reason: string | null;
  concern: string | null;
}

export interface ScoreResult {
  score: number;
  band: "Weak" | "Neutral" | "Constructive" | "Strong";
  components: ComponentResult[];
  reasons: string[];
  concerns: string[];
  dataCompleteness: number;
  invalidation: string[];
}

function avg(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

function buildMomentum(m: InstrumentMetrics): { score: number | null; reason: string | null; concern: string | null } {
  const parts = [
    scale(m.return1m, -15, 25),
    scale(m.return3m, -20, 45),
    scale(m.return6m, -30, 80),
    scale(m.return1y, -40, 120),
    m.aboveSma50 === null ? null : m.aboveSma50 ? 85 : 30,
    m.aboveSma200 === null ? null : m.aboveSma200 ? 80 : 30,
  ];
  const score = avg(parts);
  const reason =
    score !== null && m.return3m !== null
      ? `3-month return ${m.return3m.toFixed(1)}% with price ${m.aboveSma50 ? "above" : "below"} SMA-50`
      : null;
  const concern =
    m.return1y !== null && m.return1y > 120 ? "Trailing 1-year return is unusually high; momentum may mean-revert" : null;
  return { score, reason, concern };
}

function buildTechnical(m: InstrumentMetrics): { score: number | null; reason: string | null; concern: string | null } {
  const rsiScore =
    m.rsi14 === null ? null : Math.max(0, Math.min(100, 100 - Math.abs(m.rsi14 - 60) * 2.2));
  const trendScore = m.trend === "up" ? 85 : m.trend === "sideways" ? 55 : 25;
  const score = avg([rsiScore, trendScore]);
  const reason = m.rsi14 !== null ? `RSI(14) at ${m.rsi14.toFixed(1)} with a ${m.trend ?? "not-classified"} trend` : null;
  const concern =
    m.rsi14 !== null && m.rsi14 > 75
      ? "RSI(14) above 75 — technically overbought"
      : m.rsi14 !== null && m.rsi14 < 30
        ? "RSI(14) below 30 — weak short-term momentum"
        : null;
  return { score, reason, concern };
}

function buildValuation(m: InstrumentMetrics): { score: number | null; reason: string | null; concern: string | null } {
  const peScore = m.peRatio !== null && m.peRatio > 0 ? scale(m.peRatio, 60, 8) : null;
  const pbScore = m.pbRatio !== null && m.pbRatio > 0 ? scale(m.pbRatio, 6, 0.8) : null;
  const score = avg([peScore, pbScore]);
  const reason =
    m.peRatio !== null && m.peRatio > 0
      ? `P/E of ${m.peRatio.toFixed(1)}${m.pbRatio !== null ? ` and P/B of ${m.pbRatio.toFixed(2)}` : ""}`
      : null;
  const concern =
    m.peRatio !== null && m.peRatio > 45 ? "P/E above 45 — priced for high growth" : m.peRatio !== null && m.peRatio <= 0 ? "Negative or unavailable earnings; P/E not meaningful" : null;
  return { score, reason, concern };
}

function buildQuality(m: InstrumentMetrics): { score: number | null; reason: string | null; concern: string | null } {
  const roeScore = scale(m.roe, 0, 25);
  const roceScore = scale(m.roce, 0, 28);
  const leverageScore = m.debtToEquity === null ? null : m.debtToEquity <= 0 ? 90 : scale(m.debtToEquity, 3, 0);
  const score = avg([roeScore, roceScore, leverageScore]);
  const reason = m.roe !== null ? `ROE ${m.roe.toFixed(1)}%${m.debtToEquity !== null ? `, debt/equity ${m.debtToEquity.toFixed(2)}` : ""}` : null;
  const concern = m.debtToEquity !== null && m.debtToEquity > 2 ? "Debt-to-equity above 2 — elevated leverage" : null;
  return { score, reason, concern };
}

function buildGrowth(m: InstrumentMetrics): { score: number | null; reason: string | null; concern: string | null } {
  const revScore = scale(m.revenueGrowth, -10, 30);
  const earnScore = scale(m.earningsGrowth, -10, 40);
  const score = avg([revScore, earnScore]);
  const reason = m.revenueGrowth !== null ? `Revenue growth ${m.revenueGrowth.toFixed(1)}%` : null;
  const concern = m.earningsGrowth !== null && m.earningsGrowth < 0 ? "Earnings growth is negative" : null;
  return { score, reason, concern };
}

function buildLiquidity(m: InstrumentMetrics): { score: number | null; reason: string | null; concern: string | null } {
  const volumeScore =
    m.avgVolume20 === null ? null : scale(Math.log10(Math.max(1, m.avgVolume20)), 4.5, 7);
  const score = avg([volumeScore]);
  const reason = m.avgVolume20 !== null ? `Average 20-day volume ${Math.round(m.avgVolume20).toLocaleString("en-IN")}` : null;
  const concern = m.avgVolume20 !== null && m.avgVolume20 < 100_000 ? "Thin average volume — wider spreads and slippage risk" : null;
  return { score, reason, concern };
}

function buildRisk(m: InstrumentMetrics): { score: number | null; reason: string | null; concern: string | null } {
  const volScore = scale(m.volatility, 45, 12);
  const ddScore = scale(m.maxDrawdown, -50, -5);
  const score = avg([volScore, ddScore]);
  const reason = m.volatility !== null ? `Annualised volatility ~${m.volatility.toFixed(1)}%` : null;
  const concern = m.volatility !== null && m.volatility > 35 ? "High annualised volatility" : null;
  return { score, reason, concern };
}

function buildRelative(
  m: InstrumentMetrics,
  benchmarkReturn1y: number | null,
): { score: number | null; reason: string | null; concern: string | null } {
  const excess = m.return1y !== null && benchmarkReturn1y !== null ? m.return1y - benchmarkReturn1y : null;
  const score = scale(excess, -30, 30);
  const reason = excess !== null ? `${excess >= 0 ? "Outperformed" : "Underperformed"} the NIFTY 50 by ${Math.abs(excess).toFixed(1)}pp over 1 year` : null;
  const concern = excess !== null && excess < -15 ? "Materially lagging the benchmark over the past year" : null;
  return { score, reason, concern };
}

const COMPONENT_LABELS: Record<keyof ScoringWeights, string> = {
  momentum: "Price momentum",
  technical: "Technical strength",
  valuation: "Valuation",
  quality: "Financial quality",
  growth: "Growth",
  liquidity: "Liquidity",
  risk: "Risk & drawdown",
  relative: "Relative performance",
};

/**
 * Deterministic, explainable scoring. Missing metrics are excluded from a
 * component and the overall score is renormalised over available weights, so
 * incomplete data never silently produces a fabricated zero.
 */
export function scoreInstrument(
  m: InstrumentMetrics,
  benchmarkReturn1y: number | null,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoreResult {
  const builders: Record<keyof ScoringWeights, () => { score: number | null; reason: string | null; concern: string | null }> = {
    momentum: () => buildMomentum(m),
    technical: () => buildTechnical(m),
    valuation: () => buildValuation(m),
    quality: () => buildQuality(m),
    growth: () => buildGrowth(m),
    liquidity: () => buildLiquidity(m),
    risk: () => buildRisk(m),
    relative: () => buildRelative(m, benchmarkReturn1y),
  };

  const components: ComponentResult[] = [];
  let weightedSum = 0;
  let availableWeight = 0;
  let availableCount = 0;

  for (const key of WEIGHT_KEYS) {
    const { score, reason, concern } = builders[key]();
    const weight = weights[key] ?? 0;
    if (score !== null) {
      weightedSum += score * weight;
      availableWeight += weight;
      availableCount++;
    }
    components.push({
      key,
      label: COMPONENT_LABELS[key],
      score: score === null ? null : Math.round(score * 10) / 10,
      weight,
      contribution: score === null ? 0 : Math.round(score * weight * 10) / 10,
      reason,
      concern,
    });
  }

  const score = availableWeight > 0 ? Math.round((weightedSum / availableWeight) * 10) / 10 : 0;
  const band: ScoreResult["band"] = score >= 72 ? "Strong" : score >= 58 ? "Constructive" : score >= 42 ? "Neutral" : "Weak";

  const reasons = components
    .filter((c) => c.score !== null && c.score >= 55 && c.reason)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 4)
    .map((c) => `${c.label}: ${c.reason}`);
  const concerns = components
    .filter((c) => c.concern)
    .slice(0, 4)
    .map((c) => c.concern as string);

  const dataCompleteness = Math.round((availableCount / WEIGHT_KEYS.length) * 100);

  const invalidation: string[] = [
    "A sustained break below the 200-day moving average would weaken the trend components.",
    "Deteriorating quarterly earnings or a rise in leverage would lower the quality and growth components.",
  ];
  if (m.rsi14 !== null && m.rsi14 > 70) invalidation.push("Further RSI gains raise mean-reversion risk.");
  if (m.stale) invalidation.push("The underlying quote is marked stale; the score may not reflect the latest session.");

  return { score, band, components, reasons, concerns, dataCompleteness, invalidation };
}
