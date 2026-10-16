export type Exchange = "NSE" | "BSE";

export type MarketState = "PRE_OPEN" | "OPEN" | "CLOSED" | "UNAVAILABLE";

export interface Instrument {
  /** Internal, exchange-independent-ish ticker used across the app (e.g. "RELIANCE"). */
  symbol: string;
  name: string;
  exchange: Exchange;
  currency: "INR";
  /** Provider-specific identifier (e.g. Yahoo "RELIANCE.NS"). Never exposed as the primary key. */
  providerSymbol: string;
  isin?: string;
  sector?: string;
  industry?: string;
  indexMemberships?: string[];
}

export interface Quote {
  symbol: string;
  exchange: Exchange;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  currency: "INR";
  marketState: MarketState;
  /** ISO timestamp of the quote itself (provider time). */
  timestamp: string;
  source: string;
  /** True when the provider explicitly serves delayed data. */
  delayed: boolean;
  /** True when the value is older than the freshness threshold for its category. */
  stale: boolean;
}

export interface Candle {
  /** Unix seconds (UTC). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type HistoryInterval = "1d" | "1wk" | "1mo" | "1m" | "5m" | "15m" | "1h";
export type HistoryRange = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max";

export interface History {
  symbol: string;
  interval: HistoryInterval;
  range: HistoryRange;
  candles: Candle[];
  source: string;
  timestamp: string;
  stale: boolean;
}

export interface InstrumentProfile {
  symbol: string;
  name: string;
  description: string | null;
  sector: string | null;
  industry: string | null;
  employees: number | null;
  website: string | null;
  country: string | null;
  source: string;
  timestamp: string;
}

export interface Fundamentals {
  symbol: string;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  eps: number | null;
  roe: number | null;
  roce: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  revenue: number | null;
  netIncome: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  bookValue: number | null;
  faceValue: number | null;
  high52w: number | null;
  low52w: number | null;
  beta: number | null;
  /** Period the fundamentals relate to, e.g. "FY2024" or an ISO date. */
  asOf: string | null;
  source: string;
  timestamp: string;
}

export interface IndexQuote {
  symbol: string;
  name: string;
  value: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  timestamp: string;
  source: string;
  stale: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  publishedAt: string;
  summary: string | null;
  relatedSymbols: string[];
}

export interface ProviderCapabilities {
  quotes: boolean;
  history: boolean;
  intraday: boolean;
  fundamentals: boolean;
  profile: boolean;
  news: boolean;
  indices: boolean;
  search: boolean;
}

export interface ProviderHealth {
  provider: string;
  label: string;
  status: "ok" | "degraded" | "down";
  latencyMs: number | null;
  message?: string;
  checkedAt: string;
  demo: boolean;
}

export interface MarketDataProvider {
  readonly id: string;
  readonly label: string;
  readonly demo: boolean;
  readonly capabilities: ProviderCapabilities;
  searchInstruments(query: string, limit: number): Promise<Instrument[]>;
  getQuote(symbol: string): Promise<Quote | null>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getHistory(symbol: string, range: HistoryRange, interval: HistoryInterval): Promise<History>;
  getProfile(symbol: string): Promise<InstrumentProfile | null>;
  getFundamentals(symbol: string): Promise<Fundamentals | null>;
  getNews(symbols?: string[], limit?: number): Promise<NewsItem[]>;
  getIndices(): Promise<IndexQuote[]>;
  /** History for a benchmark index (e.g. "NIFTY50"). */
  getIndexHistory(indexSymbol: string, range: HistoryRange, interval: HistoryInterval): Promise<History>;
  health(): Promise<ProviderHealth>;
}
