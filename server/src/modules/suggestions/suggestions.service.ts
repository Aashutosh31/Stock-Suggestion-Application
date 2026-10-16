import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { percentChange } from "../market/indicators.js";
import { marketService } from "../market/market.service.js";
import { metricAvailability, toMetrics, type InstrumentMetrics } from "../market/metrics.js";
import { DEFAULT_WEIGHTS, scoreInstrument, type ScoreResult, type ScoringWeights } from "./scoring.js";

export interface Suggestion extends ScoreResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  price: number | null;
  changePercent: number | null;
  marketState: string | null;
  stale: boolean;
  metrics: InstrumentMetrics;
  dataAvailability: number;
  asOf: string;
  aiNarrative: string | null;
  source: string;
}

export interface SuggestionQuery {
  limit: number;
  minScore: number;
  sector?: string;
  exchange?: string;
  trend?: string;
  weights?: Partial<ScoringWeights>;
  includeStale: boolean;
  ai: boolean;
}

async function benchmarkReturn1y(): Promise<number | null> {
  try {
    const history = await marketService.getIndexHistory("NIFTY50", "1y", "1d");
    const first = history.candles.at(0);
    const last = history.candles.at(-1);
    if (!first || !last) return null;
    return percentChange(first.close, last.close);
  } catch (err) {
    logger.debug({ err: (err as Error).message }, "benchmark history unavailable");
    return null;
  }
}

function mergeWeights(partial?: Partial<ScoringWeights>): ScoringWeights {
  if (!partial) return DEFAULT_WEIGHTS;
  const merged = { ...DEFAULT_WEIGHTS };
  for (const key of Object.keys(merged) as (keyof ScoringWeights)[]) {
    const v = partial[key];
    if (typeof v === "number" && v >= 0 && v <= 1) merged[key] = v;
  }
  const sum = Object.values(merged).reduce((a, b) => a + b, 0);
  if (sum <= 0) return DEFAULT_WEIGHTS;
  for (const key of Object.keys(merged) as (keyof ScoringWeights)[]) merged[key] = merged[key] / sum;
  return merged;
}

/**
 * Optional AI explanation layer. When enabled it asks Groq's openai/gpt-oss-120b
 * model to summarise ALREADY-COMPUTED, verified metrics. It is explicitly
 * instructed not to invent values and any failure falls back to null
 * (deterministic reasons are always present regardless).
 */
async function aiNarrative(symbol: string, result: ScoreResult, m: InstrumentMetrics): Promise<string | null> {
  if (!env.AI_EXPLAIN_ENABLED || !env.GROQ_API_KEY) return null;
  const facts = {
    symbol,
    score: result.score,
    band: result.band,
    reasons: result.reasons,
    concerns: result.concerns,
    metrics: {
      peRatio: m.peRatio,
      roe: m.roe,
      return3m: m.return3m,
      rsi14: m.rsi14,
      volatility: m.volatility,
    },
  };
  try {
    const res = await fetch(`${env.GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        temperature: 0.2,
        reasoning_effort: "low",
        max_completion_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You summarise stock research metrics. Use ONLY the supplied facts. Never invent numbers or predict prices. 2-3 sentences. Not investment advice.",
          },
          { role: "user", content: JSON.stringify(facts) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function generateSuggestions(query: SuggestionQuery): Promise<{
  suggestions: Suggestion[];
  benchmarkReturn1y: number | null;
  weights: ScoringWeights;
  universeSize: number;
  generatedAt: string;
}> {
  const snapshot = await marketService.getUniverseSnapshot();
  const metrics = snapshot.map(toMetrics);
  const benchmark = await benchmarkReturn1y();
  const weights = mergeWeights(query.weights);
  const generatedAt = new Date().toISOString();

  const scored: Suggestion[] = [];
  for (const m of metrics) {
    if (!query.includeStale && m.stale) continue;
    if (m.price === null) continue; // not eligible without a price
    if (query.sector && m.sector !== query.sector) continue;
    if (query.exchange && m.exchange !== query.exchange) continue;
    if (query.trend && m.trend !== query.trend) continue;

    const result = scoreInstrument(m, benchmark, weights);
    if (result.score < query.minScore) continue;
    scored.push({
      ...result,
      symbol: m.symbol,
      name: m.name,
      exchange: m.exchange,
      sector: m.sector,
      industry: m.industry,
      price: m.price,
      changePercent: m.changePercent,
      marketState: m.marketState,
      stale: m.stale,
      metrics: m,
      dataAvailability: metricAvailability(m),
      asOf: generatedAt,
      aiNarrative: null,
      source: marketService.providerInfo.id,
    });
  }

  scored.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));
  const limited = scored.slice(0, query.limit);

  if (query.ai) {
    await Promise.all(
      limited.map(async (s) => {
        s.aiNarrative = await aiNarrative(s.symbol, s, s.metrics);
      }),
    );
  }

  return { suggestions: limited, benchmarkReturn1y: benchmark, weights, universeSize: metrics.length, generatedAt };
}
