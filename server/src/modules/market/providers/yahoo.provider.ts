import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/errors.js";
import { fetchJson } from "../../../utils/fetchJson.js";
import { round } from "../../../utils/rng.js";
import { findInstrument, INDEX_DEFINITIONS } from "../universe.js";
import { getMarketState } from "../marketCalendar.js";
import type {
  Candle,
  Fundamentals,
  History,
  HistoryInterval,
  HistoryRange,
  IndexQuote,
  Instrument,
  InstrumentProfile,
  MarketDataProvider,
  NewsItem,
  ProviderCapabilities,
  ProviderHealth,
  Quote,
} from "../types.js";

const CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search";
const SUMMARY_BASE = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const SOURCE = "yahoo";

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        currency?: string;
        symbol?: string;
        exchangeName?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
        regularMarketTime?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
      } | null;
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error: { description?: string } | null;
  };
}

interface YahooSearchResponse {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchange?: string;
    quoteType?: string;
  }>;
}

interface YahooSummaryResponse {
  quoteSummary: {
    result: Array<{
      price?: { marketCap?: { raw?: number }; regularMarketPrice?: { raw?: number } };
      summaryDetail?: {
        trailingPE?: { raw?: number };
        dividendYield?: { raw?: number };
        beta?: { raw?: number };
      };
      defaultKeyStatistics?: {
        trailingEps?: { raw?: number };
        priceToBook?: { raw?: number };
        forwardPE?: { raw?: number };
      };
      financialData?: {
        returnOnEquity?: { raw?: number };
        debtToEquity?: { raw?: number };
        revenueGrowth?: { raw?: number };
        earningsGrowth?: { raw?: number };
        totalRevenue?: { raw?: number };
        netIncomeToCommon?: { raw?: number };
      };
      assetProfile?: {
        longBusinessSummary?: string;
        sector?: string;
        industry?: string;
        fullTimeEmployees?: number;
        website?: string;
        country?: string;
      };
    }>;
    error: unknown;
  };
}

function providerToSymbol(symbol: string): string | null {
  return findInstrument(symbol)?.providerSymbol ?? null;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export class YahooMarketDataProvider implements MarketDataProvider {
  readonly id = "yahoo";
  readonly label = "Yahoo Finance (delayed, unofficial)";
  readonly demo = false;
  readonly capabilities: ProviderCapabilities = {
    quotes: true,
    history: true,
    intraday: true,
    fundamentals: true,
    profile: true,
    news: false,
    indices: true,
    search: true,
  };

  private get opts() {
    return { timeoutMs: env.MARKET_DATA_TIMEOUT_MS, retries: env.MARKET_DATA_RETRIES };
  }

  private async chart(symbol: string, range: string, interval: string): Promise<YahooChartResponse> {
    const url = `${CHART_BASE}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
    const data = await fetchJson<YahooChartResponse>(url, this.opts);
    if (data.chart?.error) {
      throw AppError.upstream(data.chart.error.description ?? "Upstream chart error");
    }
    return data;
  }

  async searchInstruments(query: string, limit: number): Promise<Instrument[]> {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=${limit}&newsCount=0&enableFuzzyQuery=false`;
    const data = await fetchJson<YahooSearchResponse>(url, this.opts);
    const results: Instrument[] = [];
    for (const q of data.quotes ?? []) {
      if (!q.symbol || q.quoteType !== "EQUITY") continue;
      const isNse = q.symbol.endsWith(".NS");
      const isBse = q.symbol.endsWith(".BO");
      if (!isNse && !isBse) continue;
      const ticker = q.symbol.replace(/\.(NS|BO)$/, "");
      const known = findInstrument(ticker);
      results.push({
        symbol: known?.symbol ?? ticker,
        name: q.longname ?? q.shortname ?? ticker,
        exchange: isNse ? "NSE" : "BSE",
        currency: "INR",
        providerSymbol: q.symbol,
        sector: known?.sector,
        industry: known?.industry,
        indexMemberships: known?.indexMemberships ?? [],
      });
    }
    return results.slice(0, limit);
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    const ps = providerToSymbol(symbol);
    if (!ps) return null;
    const data = await this.chart(ps, "1d", "1m");
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) return null;

    const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(isFiniteNumber);
    const price = isFiniteNumber(meta.regularMarketPrice)
      ? meta.regularMarketPrice
      : closes.at(-1) ?? null;
    const previousClose = isFiniteNumber(meta.chartPreviousClose)
      ? meta.chartPreviousClose
      : isFiniteNumber(meta.previousClose)
        ? meta.previousClose
        : null;
    const change = price !== null && previousClose !== null ? round(price - previousClose, 2) : null;
    const changePercent =
      change !== null && previousClose ? round((change / previousClose) * 100, 2) : null;

    return {
      symbol: symbol.toUpperCase(),
      exchange: findInstrument(symbol)?.exchange ?? "NSE",
      price: price === null ? null : round(price, 2),
      change,
      changePercent,
      previousClose: previousClose === null ? null : round(previousClose, 2),
      open: null,
      high: isFiniteNumber(meta.regularMarketDayHigh) ? round(meta.regularMarketDayHigh, 2) : null,
      low: isFiniteNumber(meta.regularMarketDayLow) ? round(meta.regularMarketDayLow, 2) : null,
      volume: isFiniteNumber(meta.regularMarketVolume) ? meta.regularMarketVolume : null,
      currency: "INR",
      marketState: getMarketState(new Date()),
      timestamp: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : new Date().toISOString(),
      source: SOURCE,
      delayed: true,
      stale: false,
    };
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const out: Quote[] = [];
    const concurrency = 4;
    for (let i = 0; i < symbols.length; i += concurrency) {
      const batch = symbols.slice(i, i + concurrency);
      const settled = await Promise.allSettled(batch.map((s) => this.getQuote(s)));
      for (const r of settled) {
        if (r.status === "fulfilled" && r.value) out.push(r.value);
      }
    }
    return out;
  }

  async getHistory(symbol: string, range: HistoryRange, interval: HistoryInterval): Promise<History> {
    const ps = providerToSymbol(symbol);
    if (!ps) throw AppError.notFound(`Unknown instrument ${symbol}`);
    const data = await this.chart(ps, range, interval);
    const result = data.chart?.result?.[0];
    const ts = result?.timestamp ?? [];
    const q = result?.indicators?.quote?.[0] ?? {};
    const candles: Candle[] = [];
    for (let i = 0; i < ts.length; i++) {
      const close = q.close?.[i];
      const open = q.open?.[i];
      const high = q.high?.[i];
      const low = q.low?.[i];
      if (!isFiniteNumber(close) || !isFiniteNumber(open) || !isFiniteNumber(high) || !isFiniteNumber(low)) continue;
      candles.push({
        time: ts[i]!,
        open: round(open, 2),
        high: round(high, 2),
        low: round(low, 2),
        close: round(close, 2),
        volume: isFiniteNumber(q.volume?.[i]) ? (q.volume?.[i] as number) : 0,
      });
    }
    return {
      symbol: symbol.toUpperCase(),
      interval,
      range,
      candles,
      source: SOURCE,
      timestamp: new Date().toISOString(),
      stale: false,
    };
  }

  private async summary(ps: string): Promise<YahooSummaryResponse["quoteSummary"]["result"][number] | null> {
    const modules = [
      "price",
      "summaryDetail",
      "defaultKeyStatistics",
      "financialData",
      "assetProfile",
    ].join(",");
    const url = `${SUMMARY_BASE}/${encodeURIComponent(ps)}?modules=${modules}`;
    try {
      const data = await fetchJson<YahooSummaryResponse>(url, this.opts);
      return data.quoteSummary?.result?.[0] ?? null;
    } catch {
      // quoteSummary frequently requires a crumb/cookie; treat as unavailable.
      return null;
    }
  }

  async getProfile(symbol: string): Promise<InstrumentProfile | null> {
    const ps = providerToSymbol(symbol);
    if (!ps) return null;
    const r = await this.summary(ps);
    const profile = r?.assetProfile;
    const known = findInstrument(symbol);
    if (!profile && !known) return null;
    return {
      symbol: symbol.toUpperCase(),
      name: known?.name ?? symbol,
      description: profile?.longBusinessSummary ?? null,
      sector: profile?.sector ?? known?.sector ?? null,
      industry: profile?.industry ?? known?.industry ?? null,
      employees: profile?.fullTimeEmployees ?? null,
      website: profile?.website ?? null,
      country: profile?.country ?? "India",
      source: SOURCE,
      timestamp: new Date().toISOString(),
    };
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    const ps = providerToSymbol(symbol);
    if (!ps) return null;
    const r = await this.summary(ps);
    if (!r) return null;
    const price = r.price;
    const detail = r.summaryDetail;
    const stats = r.defaultKeyStatistics;
    const fin = r.financialData;
    const num = (v?: { raw?: number }) => (isFiniteNumber(v?.raw) ? v!.raw : null);
    const de = num(fin?.debtToEquity);
    return {
      symbol: symbol.toUpperCase(),
      marketCap: num(price?.marketCap),
      peRatio: num(detail?.trailingPE),
      pbRatio: num(stats?.priceToBook),
      eps: num(stats?.trailingEps),
      roe: num(fin?.returnOnEquity) === null ? null : round((num(fin?.returnOnEquity) as number) * 100, 2),
      roce: null,
      debtToEquity: de === null ? null : round(de / 100, 2),
      dividendYield:
        num(detail?.dividendYield) === null ? null : round((num(detail?.dividendYield) as number) * 100, 2),
      revenue: num(fin?.totalRevenue),
      netIncome: num(fin?.netIncomeToCommon),
      revenueGrowth:
        num(fin?.revenueGrowth) === null ? null : round((num(fin?.revenueGrowth) as number) * 100, 2),
      earningsGrowth:
        num(fin?.earningsGrowth) === null ? null : round((num(fin?.earningsGrowth) as number) * 100, 2),
      bookValue: null,
      faceValue: null,
      high52w: null,
      low52w: null,
      beta: num(detail?.beta),
      asOf: null,
      source: SOURCE,
      timestamp: new Date().toISOString(),
    };
  }

  async getNews(): Promise<NewsItem[]> {
    return [];
  }

  async getIndices(): Promise<IndexQuote[]> {
    const out: IndexQuote[] = [];
    for (const idx of INDEX_DEFINITIONS) {
      try {
        const data = await this.chart(idx.providerSymbol, "1d", "1d");
        const meta = data.chart?.result?.[0]?.meta;
        const value = meta && isFiniteNumber(meta.regularMarketPrice) ? meta.regularMarketPrice : null;
        const prev = meta && isFiniteNumber(meta.chartPreviousClose) ? meta.chartPreviousClose : null;
        const change = value !== null && prev !== null ? round(value - prev, 2) : null;
        out.push({
          symbol: idx.symbol,
          name: idx.name,
          value: value === null ? null : round(value, 2),
          change,
          changePercent: change !== null && prev ? round((change / prev) * 100, 2) : null,
          previousClose: prev,
          timestamp: new Date().toISOString(),
          source: SOURCE,
          stale: false,
        });
      } catch {
        out.push({
          symbol: idx.symbol,
          name: idx.name,
          value: null,
          change: null,
          changePercent: null,
          previousClose: null,
          timestamp: new Date().toISOString(),
          source: SOURCE,
          stale: true,
        });
      }
    }
    return out;
  }

  async getIndexHistory(indexSymbol: string, range: HistoryRange, interval: HistoryInterval): Promise<History> {
    const def = INDEX_DEFINITIONS.find((i) => i.symbol === indexSymbol.toUpperCase());
    if (!def) throw AppError.notFound(`Unknown index ${indexSymbol}`);
    const data = await this.chart(def.providerSymbol, range, interval);
    const result = data.chart?.result?.[0];
    const ts = result?.timestamp ?? [];
    const q = result?.indicators?.quote?.[0] ?? {};
    const candles: Candle[] = [];
    for (let i = 0; i < ts.length; i++) {
      const close = q.close?.[i];
      const open = q.open?.[i];
      const high = q.high?.[i];
      const low = q.low?.[i];
      if (!isFiniteNumber(close) || !isFiniteNumber(open) || !isFiniteNumber(high) || !isFiniteNumber(low)) continue;
      candles.push({
        time: ts[i]!,
        open: round(open, 2),
        high: round(high, 2),
        low: round(low, 2),
        close: round(close, 2),
        volume: isFiniteNumber(q.volume?.[i]) ? (q.volume?.[i] as number) : 0,
      });
    }
    return { symbol: def.symbol, interval, range, candles, source: SOURCE, timestamp: new Date().toISOString(), stale: false };
  }

  async health(): Promise<ProviderHealth> {
    const started = Date.now();
    try {
      await this.chart("^NSEI", "1d", "1d");
      return {
        provider: this.id,
        label: this.label,
        status: "ok",
        latencyMs: Date.now() - started,
        message: "Yahoo Finance reachable. Data is delayed and unofficial; not for redistribution.",
        checkedAt: new Date().toISOString(),
        demo: false,
      };
    } catch (err) {
      return {
        provider: this.id,
        label: this.label,
        status: "down",
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : "unreachable",
        checkedAt: new Date().toISOString(),
        demo: false,
      };
    }
  }
}
