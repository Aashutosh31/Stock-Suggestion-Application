/** Client-side API types mirroring the server's normalized models. */

export type Exchange = "NSE" | "BSE";
export type MarketState = "PRE_OPEN" | "OPEN" | "CLOSED" | "UNAVAILABLE";

export interface Instrument {
  symbol: string;
  name: string;
  exchange: Exchange;
  currency: "INR";
  providerSymbol: string;
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
  timestamp: string;
  source: string;
  delayed: boolean;
  stale: boolean;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface History {
  symbol: string;
  interval: string;
  range: string;
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

export interface MarketStatus {
  state: MarketState;
  timezone: string;
  isTradingDay: boolean;
  asOf: string;
  nextOpen: string;
  provider: string;
  providerLabel: string;
  demo: boolean;
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

export interface IndicatorPoint {
  time: number;
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
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  emailVerified: boolean;
  preferences: {
    theme: "dark" | "light" | "system";
    timezone: string;
    numberFormat: "en-IN" | "en-US";
    dashboardSections: string[];
    notifications: { inApp: boolean; email: boolean };
  };
  createdAt: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  note: string | null;
  order: number;
  quote: Quote | null;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: string;
}

export interface Holding {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  quantity: number;
  averageCost: number;
  investedValue: number;
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  realizedPnl: number;
  firstBoughtAt: string | null;
  priceAvailable: boolean;
}

export interface PortfolioTotals {
  investedValue: number;
  currentValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  realizedPnl: number;
  totalFees: number;
  holdingsCount: number;
  incomplete: boolean;
}

export interface Portfolio {
  id: string;
  name: string;
  isDefault: boolean;
  baseCurrency: string;
  notes: string | null;
  totals: PortfolioTotals;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fees: number;
  tradedAt: string;
  notes: string | null;
}

export interface PaperPosition {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  investedValue: number;
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  realizedPnl: number;
}

export interface PaperSummary {
  account: {
    startingCash: number;
    cash: number;
    config: { commissionPercent: number; flatFee: number; slippagePercent: number };
    lastResetAt: string;
    createdAt: string;
  };
  positions: PaperPosition[];
  totals: {
    investedValue: number;
    marketValue: number | null;
    cash: number;
    equity: number;
    unrealizedPnl: number | null;
    realizedPnl: number;
    totalReturn: number;
    totalReturnPercent: number;
  };
}

export interface PaperTrade {
  _id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  fillPrice: number;
  grossValue: number;
  fees: number;
  realizedPnl: number | null;
  tradedAt: string;
}

export interface Alert {
  _id: string;
  symbol: string;
  type: string;
  threshold: number;
  status: "active" | "paused" | "triggered";
  note: string | null;
  lastCheckedAt: string | null;
  triggeredAt: string | null;
  triggerCount: number;
  triggerHistory: { at: string; observedValue: number | null; message: string }[];
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  symbol: string | null;
  read: boolean;
  createdAt: string;
}

export interface SuggestionComponent {
  key: string;
  label: string;
  score: number | null;
  weight: number;
  contribution: number;
  reason: string | null;
  concern: string | null;
}

export interface Suggestion {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  price: number | null;
  changePercent: number | null;
  marketState: string | null;
  stale: boolean;
  score: number;
  band: string;
  components: SuggestionComponent[];
  reasons: string[];
  concerns: string[];
  dataCompleteness: number;
  invalidation: string[];
  dataAvailability: number;
  asOf: string;
  aiNarrative: string | null;
  source: string;
  metrics: Record<string, number | string | boolean | null>;
}

export interface ScreenerRow {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  indices: string[];
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  roe: number | null;
  roce: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  volume: number | null;
  volumeRatio: number | null;
  return1m: number | null;
  return3m: number | null;
  return6m: number | null;
  return1y: number | null;
  rsi14: number | null;
  volatility: number | null;
  maxDrawdown: number | null;
  trend: string | null;
  aboveSma50: boolean | null;
  aboveSma200: boolean | null;
  goldenCross: boolean | null;
  stale: boolean;
  dataAvailability: number;
}

export interface SavedScreen {
  _id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
}

export interface ResearchNote {
  _id: string;
  symbol: string;
  title: string;
  content: string;
  createdAt: string;
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

export interface AppMeta {
  app: string;
  provider: { id: string; label: string; demo: boolean };
  filters: { sectors: string[]; industries: string[]; indices: string[] };
  capabilities: { mail: boolean; aiExplain: boolean };
  disclaimer: string;
}
