export const qk = {
  meta: ["meta"] as const,
  marketStatus: ["market", "status"] as const,
  indices: ["market", "indices"] as const,
  providerHealth: ["market", "provider-health"] as const,
  search: (q: string) => ["market", "search", q] as const,
  quotes: (symbols: string[]) => ["market", "quotes", [...symbols].sort().join(",")] as const,
  news: (symbols?: string) => ["market", "news", symbols ?? "market"] as const,

  universe: ["stocks", "universe"] as const,
  stock: (symbol: string) => ["stock", symbol] as const,
  history: (symbol: string, range: string, interval: string) => ["stock", symbol, "history", range, interval] as const,
  indicators: (symbol: string, range: string, interval: string) => ["stock", symbol, "indicators", range, interval] as const,
  fundamentals: (symbol: string) => ["stock", symbol, "fundamentals"] as const,
  profile: (symbol: string) => ["stock", symbol, "profile"] as const,
  stockNews: (symbol: string) => ["stock", symbol, "news"] as const,
  compare: (symbols: string[]) => ["stocks", "compare", [...symbols].sort().join(",")] as const,

  suggestions: (params: Record<string, unknown>) => ["suggestions", params] as const,
  weights: ["suggestions", "weights"] as const,

  screener: (params: Record<string, unknown>) => ["screener", params] as const,
  screenerMeta: ["screener", "meta"] as const,
  screenerPresets: ["screener", "presets"] as const,
  savedScreens: ["screener", "saved"] as const,

  watchlists: ["watchlists"] as const,
  watchlist: (id: string) => ["watchlists", id] as const,

  portfolios: ["portfolios"] as const,
  holdings: (id: string) => ["portfolios", id, "holdings"] as const,
  allocation: (id: string) => ["portfolios", id, "allocation"] as const,
  transactions: (id: string) => ["portfolios", id, "transactions"] as const,

  paper: ["paper", "account"] as const,
  paperTrades: ["paper", "trades"] as const,

  alerts: ["alerts"] as const,
  notifications: ["notifications"] as const,

  recentlyViewed: ["research", "recently-viewed"] as const,
  notes: (symbol?: string) => ["research", "notes", symbol ?? "all"] as const,

  adminHealth: ["admin", "health"] as const,
  adminDiagnostics: ["admin", "diagnostics"] as const,
} as const;
