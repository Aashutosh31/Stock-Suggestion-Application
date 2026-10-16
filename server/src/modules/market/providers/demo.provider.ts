import { findInstrument, INDEX_DEFINITIONS, INSTRUMENTS, toInstrument, UNIVERSE } from "../universe.js";
import { getMarketState, isTradingDay } from "../marketCalendar.js";
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
import { createRng, hashString, round } from "../../../utils/rng.js";

const ANCHOR = new Date(Date.UTC(2019, 0, 1, 4, 0, 0)); // 2019-01-01 ~09:30 IST
const SOURCE = "demo";

function basePrice(symbol: string): number {
  const rng = createRng(hashString(`${symbol}:base`));
  const tier = rng();
  // Older large caps drift to higher prices; keep a deterministic, plausible spread.
  if (tier < 0.15) return round(2000 + rng() * 2200, 2);
  if (tier < 0.5) return round(600 + rng() * 1400, 2);
  if (tier < 0.85) return round(180 + rng() * 420, 2);
  return round(40 + rng() * 140, 2);
}

function dailyDrift(symbol: string): { drift: number; vol: number } {
  const rng = createRng(hashString(`${symbol}:drift`));
  const drift = (rng() - 0.45) * 0.0016; // annualised-ish daily drift
  const vol = 0.008 + rng() * 0.016;
  return { drift, vol };
}

function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Count of useful trading days between two dates (weekends skipped). */
function tradingDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const cursor = new Date(from.getTime());
  while (cursor <= to) {
    if (isTradingDay(cursor)) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

const dailyCache = new Map<string, Candle[]>();

/** Full deterministic daily series from ANCHOR through `now`. */
function dailySeries(symbol: string, now: Date): Candle[] {
  const dayKey = now.toISOString().slice(0, 10);
  const cacheKey = `${symbol}:${dayKey}`;
  const cached = dailyCache.get(cacheKey);
  if (cached) return cached;

  const price0 = basePrice(symbol);
  const { drift, vol } = dailyDrift(symbol);
  const rng = createRng(hashString(`${symbol}:walk`));
  const candles: Candle[] = [];
  let close = price0;
  const cursor = new Date(ANCHOR.getTime());
  let i = 0;
  while (cursor <= now && i < 4000) {
    if (isTradingDay(cursor)) {
      const shock = gaussian(rng);
      const ret = drift + vol * shock;
      const open = close;
      const nextClose = Math.max(1, open * (1 + ret));
      const hi = Math.max(open, nextClose) * (1 + Math.abs(gaussian(rng)) * vol * 0.6);
      const lo = Math.min(open, nextClose) * (1 - Math.abs(gaussian(rng)) * vol * 0.6);
      const volume = Math.round((300_000 + rng() * 4_500_000) * (1 + Math.abs(ret) * 40));
      candles.push({
        time: Math.floor(cursor.getTime() / 1000),
        open: round(open, 2),
        high: round(hi, 2),
        low: round(lo, 2),
        close: round(nextClose, 2),
        volume,
      });
      close = nextClose;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    i++;
  }
  dailyCache.set(cacheKey, candles);
  return candles;
}

const RANGE_DAYS: Record<HistoryRange, number> = {
  "1d": 1,
  "5d": 7,
  "1mo": 30,
  "3mo": 92,
  "6mo": 183,
  "1y": 366,
  "2y": 731,
  "5y": 1827,
  max: 4000,
};

function intradaySeries(symbol: string, now: Date, interval: HistoryInterval): Candle[] {
  const minutesPerBar = interval === "1m" ? 1 : interval === "5m" ? 5 : interval === "15m" ? 15 : 60;
  const dayCandles = dailySeries(symbol, now);
  const last = dayCandles.at(-1);
  const lastClose = last ? last.close : basePrice(symbol);
  const rng = createRng(hashString(`${symbol}:${now.toISOString().slice(0, 10)}:intraday`));
  const bars = Math.floor((375 / minutesPerBar));
  const sessionStart = new Date(now);
  sessionStart.setUTCHours(3, 45, 0, 0); // 09:15 IST
  const out: Candle[] = [];
  let price = lastClose * (1 - 0.01 + rng() * 0.02);
  for (let i = 0; i < bars; i++) {
    const t = sessionStart.getTime() + i * minutesPerBar * 60_000;
    if (t > now.getTime()) break;
    const vol = 0.0018 * (1 + minutesPerBar / 15);
    const ret = 0.00002 + vol * gaussian(rng);
    const open = price;
    const closeP = Math.max(1, open * (1 + ret));
    const hi = Math.max(open, closeP) * (1 + Math.abs(gaussian(rng)) * vol * 0.5);
    const lo = Math.min(open, closeP) * (1 - Math.abs(gaussian(rng)) * vol * 0.5);
    out.push({
      time: Math.floor(t / 1000),
      open: round(open, 2),
      high: round(hi, 2),
      low: round(lo, 2),
      close: round(closeP, 2),
      volume: Math.round(20_000 + rng() * 250_000),
    });
    price = closeP;
  }
  return out;
}

function buildQuote(symbol: string, now: Date): Quote {
  const inst = findInstrument(symbol);
  const candles = dailySeries(symbol, now);
  const today = candles.at(-1);
  const prev = candles.at(-2);
  const previousClose = prev?.close ?? today?.open ?? basePrice(symbol);
  const marketState = getMarketState(now);

  let price: number;
  if (today && marketState === "OPEN") {
    // live-ish wiggle within today's range, deterministic per minute
    const minuteBucket = Math.floor(now.getTime() / 60_000);
    const rng = createRng(hashString(`${symbol}:live:${minuteBucket}`));
    const w = (rng() - 0.5) * 0.004;
    price = round(previousClose * (1 + w), 2);
  } else if (today) {
    price = today.close;
  } else {
    price = basePrice(symbol);
  }

  const change = round(price - previousClose, 2);
  const changePercent = previousClose ? round((change / previousClose) * 100, 2) : 0;
  const dayHigh = today ? Math.max(today.high, price) : price;
  const dayLow = today ? Math.min(today.low, price) : price;

  return {
    symbol,
    exchange: inst?.exchange ?? "NSE",
    price,
    change,
    changePercent,
    previousClose,
    open: today?.open ?? price,
    high: round(dayHigh, 2),
    low: round(dayLow, 2),
    volume: today?.volume ?? null,
    currency: "INR",
    marketState,
    timestamp: now.toISOString(),
    source: SOURCE,
    delayed: false,
    stale: false,
  };
}

function buildFundamentals(symbol: string, now: Date): Fundamentals {
  const inst = findInstrument(symbol);
  const candles = dailySeries(symbol, now);
  const price = candles.at(-1)?.close ?? basePrice(symbol);
  const rng = createRng(hashString(`${symbol}:fundamentals`));
  const shares = 100_000_000 + rng() * 6_000_000_000;
  const marketCap = round(price * shares, 0);
  const eps = round(price / (8 + rng() * 42), 2);
  const peRatio = eps > 0 ? round(price / eps, 2) : null;
  const bookValue = round(price / (0.8 + rng() * 6), 2);
  const pbRatio = bookValue > 0 ? round(price / bookValue, 2) : null;
  const roe = round(4 + rng() * 26, 2);
  const roce = round(3 + rng() * 28, 2);
  const debtToEquity = round(rng() * (inst?.sector === "Financial Services" ? 6 : 1.8), 2);
  const dividendYield = round(rng() * (inst?.sector === "Utilities" || inst?.sector === "Energy" ? 6 : 2.5), 2);
  const revenue = round(marketCap * (0.15 + rng() * 0.6), 0);
  const netIncome = round(revenue * (0.03 + rng() * 0.22), 0);
  const yearCandles = candles.slice(-252);
  const high52w = yearCandles.length ? round(Math.max(...yearCandles.map((c) => c.high)), 2) : round(price * 1.2, 2);
  const low52w = yearCandles.length ? round(Math.min(...yearCandles.map((c) => c.low)), 2) : round(price * 0.8, 2);

  return {
    symbol,
    marketCap,
    peRatio,
    pbRatio,
    eps,
    roe,
    roce,
    debtToEquity,
    dividendYield,
    revenue,
    netIncome,
    revenueGrowth: round((rng() - 0.3) * 40, 2),
    earningsGrowth: round((rng() - 0.3) * 45, 2),
    bookValue,
    faceValue: rng() < 0.5 ? 1 : 2,
    high52w,
    low52w,
    beta: round(0.5 + rng() * 1.4, 2),
    asOf: "FY2024",
    source: SOURCE,
    timestamp: now.toISOString(),
  };
}

export class DemoMarketDataProvider implements MarketDataProvider {
  readonly id = "demo";
  readonly label = "Demo Data (simulated)";
  readonly demo = true;
  readonly capabilities: ProviderCapabilities = {
    quotes: true,
    history: true,
    intraday: true,
    fundamentals: true,
    profile: true,
    news: true,
    indices: true,
    search: true,
  };

  constructor(private readonly nowFn: () => Date = () => new Date()) {}

  async searchInstruments(query: string, limit: number): Promise<Instrument[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = UNIVERSE.filter(
      (u) => u.symbol.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.sector.toLowerCase().includes(q),
    )
      .sort((a, b) => {
        const aExact = a.symbol.toLowerCase() === q ? 0 : 1;
        const bExact = b.symbol.toLowerCase() === q ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        const aStarts = a.symbol.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.symbol.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.symbol.localeCompare(b.symbol);
      })
      .slice(0, limit);
    return matches.map(toInstrument);
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!findInstrument(symbol)) return null;
    return buildQuote(symbol.toUpperCase(), this.nowFn());
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    return symbols
      .map((s) => buildQuoteIfExists(s, this.nowFn()))
      .filter((q): q is Quote => q !== null);
  }

  async getHistory(symbol: string, range: HistoryRange, interval: HistoryInterval): Promise<History> {
    const upper = symbol.toUpperCase();
    const now = this.nowFn();
    const isIntraday = interval === "1m" || interval === "5m" || interval === "15m" || interval === "1h";
    let candles: Candle[];
    if (range === "1d" || isIntraday) {
      candles = intradaySeries(upper, now, interval);
      if (candles.length === 0) candles = dailySeries(upper, now).slice(-1);
    } else {
      const all = dailySeries(upper, now);
      const days = RANGE_DAYS[range];
      const cutoffMs = now.getTime() - days * 86_400_000;
      candles = all.filter((c) => c.time * 1000 >= cutoffMs);
      if (candles.length < 2) candles = all.slice(-Math.min(all.length, 2));
    }
    return {
      symbol: upper,
      interval,
      range,
      candles,
      source: SOURCE,
      timestamp: now.toISOString(),
      stale: false,
    };
  }

  async getProfile(symbol: string): Promise<InstrumentProfile | null> {
    const inst = findInstrument(symbol);
    if (!inst) return null;
    const now = this.nowFn();
    return {
      symbol: inst.symbol,
      name: inst.name,
      description:
        `${inst.name} is a constituent of the ${inst.sector} sector (${inst.industry}). ` +
        `This description is generated for the demo data provider and is not sourced from a filing.`,
      sector: inst.sector ?? null,
      industry: inst.industry ?? null,
      employees: 1000 + (hashString(inst.symbol) % 90_000),
      website: null,
      country: "India",
      source: SOURCE,
      timestamp: now.toISOString(),
    };
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    if (!findInstrument(symbol)) return null;
    return buildFundamentals(symbol.toUpperCase(), this.nowFn());
  }

  async getNews(symbols?: string[]): Promise<NewsItem[]> {
    const now = this.nowFn();
    const focus = symbols && symbols.length ? symbols[0]! : "NIFTY 50";
    const templates = [
      `${focus} draws analyst attention amid sector rotation`,
      `Volumes build in ${focus} ahead of quarterly results`,
      `${focus}: brokerages trim targets after recent run-up`,
      `Domestic institutional flows steady as ${focus} consolidates`,
      `${focus} in focus as global cues turn mixed`,
    ];
    return templates.map((title, i) => ({
      id: `demo-${focus}-${i}`,
      title,
      url: "https://example.com/demo-news",
      publisher: "Demo Wire (simulated)",
      publishedAt: new Date(now.getTime() - (i + 1) * 2 * 3600_000).toISOString(),
      summary: "Simulated headline for the demo data provider. Not a real article.",
      relatedSymbols: symbols && symbols.length ? symbols : [],
    }));
  }

  async getIndices(): Promise<IndexQuote[]> {
    const now = this.nowFn();
    return INDEX_DEFINITIONS.map((idx) => {
      const candles = dailySeries(idx.symbol, now);
      const today = candles.at(-1);
      const prev = candles.at(-2);
      const base = idx.symbol.startsWith("NIFTY") || idx.symbol === "SENSEX" ? 1 : 1;
      const value = today ? today.close * (idx.symbol === "NIFTY50" ? 128 : idx.symbol === "SENSEX" ? 420 : idx.symbol === "NIFTYBANK" ? 290 : 60) * base : null;
      const previousClose = prev ? prev.close * (idx.symbol === "NIFTY50" ? 128 : idx.symbol === "SENSEX" ? 420 : idx.symbol === "NIFTYBANK" ? 290 : 60) : null;
      const change = value !== null && previousClose !== null ? round(value - previousClose, 2) : null;
      return {
        symbol: idx.symbol,
        name: idx.name,
        value: value === null ? null : round(value, 2),
        change,
        changePercent: change !== null && previousClose ? round((change / previousClose) * 100, 2) : null,
        previousClose,
        timestamp: now.toISOString(),
        source: SOURCE,
        stale: false,
      };
    });
  }

  async getIndexHistory(indexSymbol: string, range: HistoryRange, interval: HistoryInterval): Promise<History> {
    return this.getHistory(indexSymbol.toUpperCase(), range, interval);
  }

  async health(): Promise<ProviderHealth> {
    return {
      provider: this.id,
      label: this.label,
      status: "ok",
      latencyMs: 1,
      message: "Simulated provider active. Data is generated, not live market data.",
      checkedAt: new Date().toISOString(),
      demo: true,
    };
  }
}

function buildQuoteIfExists(symbol: string, now: Date): Quote | null {
  if (!findInstrument(symbol)) return null;
  return buildQuote(symbol.toUpperCase(), now);
}

export const demoProvider = new DemoMarketDataProvider();
