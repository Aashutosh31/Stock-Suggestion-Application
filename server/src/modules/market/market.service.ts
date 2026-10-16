import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { appCache } from "../../utils/cache.js";
import { AppError } from "../../utils/errors.js";
import { getMarketState, isTradingDay, MARKET_TIMEZONE, nextMarketOpen } from "./marketCalendar.js";
import { getActiveProvider, listProviders } from "./providers/index.js";
import { computeTechnicalSnapshot, type TechnicalSnapshot } from "./indicators.js";
import { allIndustries, allIndices, allSectors, findInstrument, INSTRUMENTS } from "./universe.js";
import type {
  Fundamentals,
  History,
  HistoryInterval,
  HistoryRange,
  IndexQuote,
  Instrument,
  InstrumentProfile,
  NewsItem,
  ProviderHealth,
  Quote,
} from "./types.js";

export interface UniverseSnapshotRow {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  indices: string[];
  quote: Quote | null;
  fundamentals: Fundamentals | null;
  technical: TechnicalSnapshot | null;
}

export interface MarketStatus {
  state: ReturnType<typeof getMarketState>;
  timezone: string;
  isTradingDay: boolean;
  asOf: string;
  nextOpen: string;
  provider: string;
  providerLabel: string;
  demo: boolean;
}

function quoteStaleThresholdSeconds(): number {
  return Math.max(env.QUOTE_CACHE_TTL_SECONDS * 4, 120);
}

export class MarketService {
  private provider = getActiveProvider();

  /** Re-resolve the provider (useful after config changes in tests). */
  refreshProvider(): void {
    this.provider = getActiveProvider();
  }

  get providerInfo() {
    return { id: this.provider.id, label: this.provider.label, demo: this.provider.demo };
  }

  async search(query: string, limit = 10): Promise<Instrument[]> {
    const q = query.trim();
    if (q.length < 1) return [];
    const key = `search:${this.provider.id}:${q.toLowerCase()}:${limit}`;
    const { value } = await appCache.getOrSet(key, env.SEARCH_CACHE_TTL_SECONDS, () =>
      this.provider.searchInstruments(q, limit),
    );
    return value;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const upper = symbol.toUpperCase();
    if (!findInstrument(upper)) {
      // Allow indices-ish unknown symbols only if they exist in universe.
      throw AppError.notFound(`Instrument ${upper} not found`);
    }
    const key = `quote:${this.provider.id}:${upper}`;
    const { value, stale, storedAt } = await appCache.getOrSet(
      key,
      env.QUOTE_CACHE_TTL_SECONDS,
      () => this.provider.getQuote(upper),
    );
    if (!value) throw AppError.notFound(`No quote for ${upper}`);
    return this.finalizeQuote(value, stale, storedAt);
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const unique = [...new Set(symbols.map((s) => s.toUpperCase()))].filter((s) => findInstrument(s));
    if (unique.length === 0) return [];
    const missing: string[] = [];
    const results: Quote[] = [];
    const fresh = await this.provider.getQuotes(unique);
    const bySymbol = new Map(fresh.map((q) => [q.symbol, q]));
    for (const sym of unique) {
      const q = bySymbol.get(sym);
      if (q) {
        appCache.set(`quote:${this.provider.id}:${sym}`, q, env.QUOTE_CACHE_TTL_SECONDS);
        results.push(this.finalizeQuote(q, false, Date.now()));
      } else {
        const cached = appCache.get<Quote>(`quote:${this.provider.id}:${sym}`);
        if (cached) results.push(this.finalizeQuote(cached.value, true, Date.now()));
        else missing.push(sym);
      }
    }
    if (missing.length) logger.debug({ missing }, "quotes unavailable");
    return results;
  }

  private finalizeQuote(quote: Quote, cachedStale: boolean, storedAt: number): Quote {
    const ageSeconds = (Date.now() - storedAt) / 1000;
    const stale = quote.stale || cachedStale || quote.price === null || ageSeconds > quoteStaleThresholdSeconds();
    return { ...quote, stale };
  }

  async getHistory(symbol: string, range: HistoryRange, interval: HistoryInterval): Promise<History> {
    const upper = symbol.toUpperCase();
    if (!findInstrument(upper)) throw AppError.notFound(`Instrument ${upper} not found`);
    const key = `history:${this.provider.id}:${upper}:${range}:${interval}`;
    const { value, stale } = await appCache.getOrSet(key, env.HISTORY_CACHE_TTL_SECONDS, () =>
      this.provider.getHistory(upper, range, interval),
    );
    return { ...value, stale };
  }

  async getIndexHistory(indexSymbol: string, range: HistoryRange, interval: HistoryInterval): Promise<History> {
    const key = `indexhistory:${this.provider.id}:${indexSymbol}:${range}:${interval}`;
    const { value } = await appCache.getOrSet(key, env.HISTORY_CACHE_TTL_SECONDS, () =>
      this.provider.getIndexHistory(indexSymbol.toUpperCase(), range, interval),
    );
    return value;
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    const upper = symbol.toUpperCase();
    if (!findInstrument(upper)) throw AppError.notFound(`Instrument ${upper} not found`);
    const key = `fundamentals:${this.provider.id}:${upper}`;
    const { value } = await appCache.getOrSet(key, env.FUNDAMENTALS_CACHE_TTL_SECONDS, () =>
      this.provider.getFundamentals(upper),
    );
    return value;
  }

  async getProfile(symbol: string): Promise<InstrumentProfile | null> {
    const upper = symbol.toUpperCase();
    const key = `profile:${this.provider.id}:${upper}`;
    const { value } = await appCache.getOrSet(key, env.FUNDAMENTALS_CACHE_TTL_SECONDS, () =>
      this.provider.getProfile(upper),
    );
    return value;
  }

  async getIndices(): Promise<IndexQuote[]> {
    const key = `indices:${this.provider.id}`;
    const { value } = await appCache.getOrSet(key, env.QUOTE_CACHE_TTL_SECONDS, () =>
      this.provider.getIndices(),
    );
    return value;
  }

  async getNews(symbols?: string[], limit = 10): Promise<NewsItem[]> {
    if (!this.provider.capabilities.news) return [];
    const key = `news:${this.provider.id}:${(symbols ?? []).join(",")}`;
    const { value } = await appCache.getOrSet(key, 900, () => this.provider.getNews(symbols));
    return value.slice(0, limit);
  }

  getMarketStatus(): MarketStatus {
    const now = new Date();
    return {
      state: getMarketState(now),
      timezone: MARKET_TIMEZONE,
      isTradingDay: isTradingDay(now),
      asOf: now.toISOString(),
      nextOpen: nextMarketOpen(now).toISOString(),
      provider: this.provider.id,
      providerLabel: this.provider.label,
      demo: this.provider.demo,
    };
  }

  /** Full universe snapshot powering the screener and suggestion engine. */
  async getUniverseSnapshot(): Promise<UniverseSnapshotRow[]> {
    const key = `snapshot:${this.provider.id}`;
    const ttl = Math.max(env.HISTORY_CACHE_TTL_SECONDS, 300);
    const { value } = await appCache.getOrSet<UniverseSnapshotRow[]>(key, ttl, async () => {
      const rows: UniverseSnapshotRow[] = [];
      const concurrency = this.provider.demo ? 20 : 4;
      for (let i = 0; i < INSTRUMENTS.length; i += concurrency) {
        const batch = INSTRUMENTS.slice(i, i + concurrency);
        const settled = await Promise.all(
          batch.map(async (inst): Promise<UniverseSnapshotRow> => {
            const [quote, fundamentals, history] = await Promise.all([
              this.safeQuote(inst.symbol),
              this.safeFundamentals(inst.symbol),
              this.safeHistory(inst.symbol, "1y", "1d"),
            ]);
            const technical = history && history.candles.length > 30 ? computeTechnicalSnapshot(history.candles) : null;
            return {
              symbol: inst.symbol,
              name: inst.name,
              exchange: inst.exchange,
              sector: inst.sector ?? null,
              industry: inst.industry ?? null,
              indices: inst.indexMemberships ?? [],
              quote,
              fundamentals,
              technical,
            };
          }),
        );
        rows.push(...settled);
      }
      return rows;
    });
    return value;
  }

  private async safeQuote(symbol: string): Promise<Quote | null> {
    try {
      const key = `quote:${this.provider.id}:${symbol}`;
      const { value, stale, storedAt } = await appCache.getOrSet(key, env.QUOTE_CACHE_TTL_SECONDS, () =>
        this.provider.getQuote(symbol),
      );
      return value ? this.finalizeQuote(value, stale, storedAt) : null;
    } catch (err) {
      logger.debug({ symbol, err: (err as Error).message }, "safeQuote failed");
      const cached = appCache.get<Quote>(`quote:${this.provider.id}:${symbol}`);
      return cached ? this.finalizeQuote(cached.value, true, Date.now()) : null;
    }
  }

  private async safeFundamentals(symbol: string): Promise<Fundamentals | null> {
    try {
      const key = `fundamentals:${this.provider.id}:${symbol}`;
      const { value } = await appCache.getOrSet(key, env.FUNDAMENTALS_CACHE_TTL_SECONDS, () =>
        this.provider.getFundamentals(symbol),
      );
      return value;
    } catch {
      return null;
    }
  }

  private async safeHistory(symbol: string, range: HistoryRange, interval: HistoryInterval): Promise<History | null> {
    try {
      return await this.getHistory(symbol, range, interval);
    } catch {
      return null;
    }
  }

  async health(): Promise<ProviderHealth> {
    return this.provider.health();
  }

  meta() {
    return {
      activeProvider: this.providerInfo,
      providers: listProviders(),
      sectors: allSectors(),
      industries: allIndustries(),
      indices: allIndices(),
      universitySize: INSTRUMENTS.length,
    };
  }
}

export const marketService = new MarketService();
export { MARKET_TIMEZONE };
