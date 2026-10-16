import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type {
  Alert,
  AppMeta,
  Candle,
  Fundamentals,
  History,
  Holding,
  IndexQuote,
  IndicatorPoint,
  Instrument,
  InstrumentProfile,
  MarketStatus,
  NewsItem,
  Notification,
  PaperSummary,
  PaperTrade,
  Portfolio,
  PortfolioTotals,
  ProviderHealth,
  Quote,
  ResearchNote,
  SavedScreen,
  ScreenerRow,
  Suggestion,
  TechnicalSnapshot,
  Transaction,
  User,
  Watchlist,
} from "@/lib/types";

/* ── Market ─────────────────────────────────────────────────────────── */

export function useAppMeta() {
  return useQuery({
    queryKey: qk.meta,
    queryFn: () => api.get<AppMeta>("/market/meta"),
    staleTime: 30 * 60_000,
  });
}

export function useMarketStatus() {
  return useQuery({
    queryKey: qk.marketStatus,
    queryFn: () => api.get<MarketStatus>("/market/status"),
    staleTime: 20_000,
    refetchInterval: 60_000,
  });
}

export function useIndices() {
  return useQuery({
    queryKey: qk.indices,
    queryFn: () => api.get<{ indices: IndexQuote[] }>("/market/indices").then((d) => d.indices),
    staleTime: 20_000,
    refetchInterval: 45_000,
  });
}

export function useProviderHealth() {
  return useQuery({
    queryKey: qk.providerHealth,
    queryFn: () => api.get<{ health: ProviderHealth; cache: unknown }>("/market/provider/health"),
    staleTime: 30_000,
  });
}

export function useSearch(query: string, limit = 10) {
  return useQuery({
    queryKey: qk.search(query),
    queryFn: () => api.get<{ results: Instrument[] }>("/market/search", { query: { q: query, limit } }).then((d) => d.results),
    enabled: query.trim().length >= 1,
    staleTime: 60_000,
  });
}

export function useQuotes(symbols: string[]) {
  return useQuery({
    queryKey: qk.quotes(symbols),
    queryFn: () => api.get<{ quotes: Quote[] }>("/market/quotes", { query: { symbols: symbols.join(",") } }).then((d) => d.quotes),
    enabled: symbols.length > 0,
    staleTime: 15_000,
  });
}

export function useNews(symbols?: string[], limit = 12) {
  return useQuery({
    queryKey: qk.news(symbols?.join(",")),
    queryFn: () =>
      api.get<{ news: NewsItem[] }>("/market/news", { query: { symbols: symbols?.join(","), limit } }).then((d) => d.news),
    staleTime: 120_000,
  });
}

/* ── Stocks ─────────────────────────────────────────────────────────── */

export interface StockDetail {
  instrument: Instrument;
  quote: Quote | null;
  profile: InstrumentProfile | null;
  fundamentals: Fundamentals | null;
  marketStatus: MarketStatus;
  source: { id: string; label: string; demo: boolean };
}

export function useStockDetail(symbol: string | undefined) {
  return useQuery({
    queryKey: qk.stock(symbol ?? ""),
    queryFn: () => api.get<StockDetail>(`/stocks/${symbol}`),
    enabled: Boolean(symbol),
    staleTime: 15_000,
  });
}

export function useStockHistory(symbol: string | undefined, range: string, interval: string) {
  return useQuery({
    queryKey: qk.history(symbol ?? "", range, interval),
    queryFn: () =>
      api.get<{ history: History }>(`/stocks/${symbol}/history`, { query: { range, interval } }).then((d) => d.history),
    enabled: Boolean(symbol),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export interface IndicatorPayload {
  symbol: string;
  range: string;
  interval: string;
  series: IndicatorPoint[];
  snapshot: TechnicalSnapshot;
}

export function useStockIndicators(symbol: string | undefined, range: string, interval: string) {
  return useQuery({
    queryKey: qk.indicators(symbol ?? "", range, interval),
    queryFn: () => api.get<IndicatorPayload>(`/stocks/${symbol}/indicators`, { query: { range, interval } }),
    enabled: Boolean(symbol),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useUniverse() {
  return useQuery({
    queryKey: qk.universe,
    queryFn: () => api.get<{ instruments: (Instrument & { indices: string[] })[] }>("/stocks/universe").then((d) => d.instruments),
    staleTime: 30 * 60_000,
  });
}

export interface CompareRow {
  symbol: string;
  name?: string;
  quote: Quote | null;
  fundamentals: Fundamentals | null;
  technical: TechnicalSnapshot | null;
}

export function useCompare(symbols: string[]) {
  return useQuery({
    queryKey: qk.compare(symbols),
    queryFn: () =>
      api.get<{ comparison: CompareRow[] }>("/stocks/compare", { query: { symbols: symbols.join(",") } }).then((d) => d.comparison),
    enabled: symbols.length >= 2,
    staleTime: 60_000,
  });
}

/* ── Suggestions ────────────────────────────────────────────────────── */

export interface SuggestionsPayload {
  suggestions: Suggestion[];
  benchmarkReturn1y: number | null;
  weights: Record<string, number>;
  universeSize: number;
  generatedAt: string;
  disclaimer: string;
}

export interface SuggestionParams {
  limit?: number;
  minScore?: number;
  sector?: string;
  exchange?: string;
  trend?: string;
  includeStale?: boolean;
  ai?: boolean;
}

export function useSuggestions(params: SuggestionParams = {}) {
  return useQuery({
    queryKey: qk.suggestions(params as Record<string, unknown>),
    queryFn: () =>
      api.get<SuggestionsPayload>("/suggestions", {
        query: {
          limit: params.limit ?? 15,
          minScore: params.minScore ?? 0,
          sector: params.sector,
          exchange: params.exchange,
          trend: params.trend,
          includeStale: params.includeStale,
          ai: params.ai,
        },
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useCustomSuggestions() {
  return useMutation({
    mutationFn: (input: SuggestionParams & { weights?: Record<string, number>; ai?: boolean }) =>
      api.post<SuggestionsPayload>("/suggestions", {
        limit: input.limit ?? 20,
        minScore: input.minScore ?? 0,
        sector: input.sector,
        exchange: input.exchange,
        trend: input.trend,
        includeStale: input.includeStale ?? false,
        ai: input.ai ?? false,
        weights: input.weights,
      }),
  });
}

export function useDefaultWeights() {
  return useQuery({
    queryKey: qk.weights,
    queryFn: () => api.get<{ defaults: Record<string, number> }>("/suggestions/weights").then((d) => d.defaults),
    staleTime: 30 * 60_000,
  });
}

/* ── Screener ───────────────────────────────────────────────────────── */

export interface ScreenerPayload {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  results: ScreenerRow[];
  appliedFilters: Record<string, unknown>;
  generatedAt: string;
}

export type ScreenerFilters = Record<string, string | number | boolean | undefined>;

export function useScreener(params: ScreenerFilters) {
  return useQuery({
    queryKey: qk.screener(params),
    queryFn: () =>
      api.get<ScreenerPayload>("/screener", {
        query: params as Record<string, string | number | boolean | undefined | null>,
      }),
    staleTime: 45_000,
    placeholderData: keepPreviousData,
  });
}

export interface ScreenerMeta {
  sectors: string[];
  industries: string[];
  indices: string[];
  sortFields: string[];
}

export function useScreenerMeta() {
  return useQuery({
    queryKey: qk.screenerMeta,
    queryFn: () => api.get<ScreenerMeta>("/screener/meta"),
    staleTime: 30 * 60_000,
  });
}

export function useScreenerPresets() {
  return useQuery({
    queryKey: qk.screenerPresets,
    queryFn: () =>
      api
        .get<{ presets: { id: string; name: string; description: string; filters: Record<string, unknown> }[] }>("/screener/presets")
        .then((d) => d.presets),
    staleTime: 30 * 60_000,
  });
}

export function useSavedScreens() {
  return useQuery({
    queryKey: qk.savedScreens,
    queryFn: () => api.get<{ screens: SavedScreen[] }>("/screener/saved").then((d) => d.screens),
    staleTime: 30_000,
  });
}

export function useSaveScreen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; filters: Record<string, unknown> }) =>
      api.post<{ screen: SavedScreen }>("/screener/saved", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.savedScreens }),
  });
}

export function useDeleteScreen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/screener/saved/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.savedScreens }),
  });
}

export function exportScreenerCsv(params: ScreenerFilters) {
  return api.download("/screener/export.csv", params as Record<string, string | number | boolean | undefined | null>);
}

/* ── Watchlists ─────────────────────────────────────────────────────── */

export function useWatchlists() {
  return useQuery({
    queryKey: qk.watchlists,
    queryFn: () => api.get<{ watchlists: Watchlist[] }>("/watchlists").then((d) => d.watchlists),
    staleTime: 15_000,
  });
}

export function useWatchlist(id: string | undefined) {
  return useQuery({
    queryKey: qk.watchlist(id ?? ""),
    queryFn: () => api.get<{ watchlist: Watchlist }>(`/watchlists/${id}`).then((d) => d.watchlist),
    enabled: Boolean(id),
  });
}

export function useCreateWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<{ watchlist: Watchlist }>("/watchlists", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.watchlists }),
  });
}

export function useRenameWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patch<{ watchlist: Watchlist }>(`/watchlists/${id}`, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.watchlists }),
  });
}

export function useDeleteWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/watchlists/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.watchlists }),
  });
}

export function useAddWatchlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, symbol, note }: { id: string; symbol: string; note?: string }) =>
      api.post(`/watchlists/${id}/items`, { symbol, note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.watchlists }),
  });
}

export function useRemoveWatchlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, symbol }: { id: string; symbol: string }) => api.delete(`/watchlists/${id}/items/${symbol}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.watchlists }),
  });
}

/* ── Portfolio ──────────────────────────────────────────────────────── */

export function usePortfolios() {
  return useQuery({
    queryKey: qk.portfolios,
    queryFn: () => api.get<{ portfolios: Portfolio[] }>("/portfolio").then((d) => d.portfolios),
    staleTime: 20_000,
  });
}

export interface HoldingsPayload {
  holdings: Holding[];
  totals: PortfolioTotals;
  portfolio?: { name?: string };
}

export function useHoldings(id: string | undefined) {
  return useQuery({
    queryKey: qk.holdings(id ?? ""),
    queryFn: () => api.get<HoldingsPayload>(`/portfolio/${id}/holdings`),
    enabled: Boolean(id),
    staleTime: 20_000,
  });
}

export interface AllocationPayload {
  total: number;
  bySector: { label: string; value: number; percent: number }[];
  byInstrument: { label: string; value: number; percent: number }[];
}

export function useAllocation(id: string | undefined) {
  return useQuery({
    queryKey: qk.allocation(id ?? ""),
    queryFn: () => api.get<AllocationPayload>(`/portfolio/${id}/allocation`),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useTransactions(id: string | undefined) {
  return useQuery({
    queryKey: qk.transactions(id ?? ""),
    queryFn: () => api.get<{ transactions: Transaction[] }>(`/portfolio/${id}/transactions`).then((d) => d.transactions),
    enabled: Boolean(id),
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post("/portfolio", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.portfolios }),
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/portfolio/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.portfolios }),
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) => api.post(`/portfolio/${id}/transactions`, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: qk.holdings(vars.id) });
      void qc.invalidateQueries({ queryKey: qk.transactions(vars.id) });
      void qc.invalidateQueries({ queryKey: qk.portfolios });
      void qc.invalidateQueries({ queryKey: qk.allocation(vars.id) });
    },
  });
}

export function useDeleteTransaction(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) => api.delete(`/portfolio/transactions/${transactionId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.holdings(portfolioId) });
      void qc.invalidateQueries({ queryKey: qk.transactions(portfolioId) });
      void qc.invalidateQueries({ queryKey: qk.portfolios });
    },
  });
}

/* ── Paper trading ──────────────────────────────────────────────────── */

export function usePaperAccount() {
  return useQuery({
    queryKey: qk.paper,
    queryFn: () => api.get<PaperSummary>("/paper/account"),
    staleTime: 10_000,
  });
}

export function usePaperTrades() {
  return useQuery({
    queryKey: qk.paperTrades,
    queryFn: () => api.get<{ trades: PaperTrade[] }>("/paper/trades").then((d) => d.trades),
    staleTime: 10_000,
  });
}

export function usePlacePaperOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { symbol: string; side: "buy" | "sell"; quantity: number }) =>
      api.post<{ trade: PaperTrade; cash: number }>("/paper/orders", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.paper });
      void qc.invalidateQueries({ queryKey: qk.paperTrades });
    },
  });
}

export function useResetPaperAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (startingCash: number) => api.post("/paper/reset", { startingCash }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.paper });
      void qc.invalidateQueries({ queryKey: qk.paperTrades });
    },
  });
}

export function useUpdatePaperConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: { commissionPercent?: number; flatFee?: number; slippagePercent?: number }) =>
      api.patch("/paper/config", config),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.paper }),
  });
}

/* ── Alerts & notifications ─────────────────────────────────────────── */

export function useAlerts() {
  return useQuery({
    queryKey: qk.alerts,
    queryFn: () => api.get<{ alerts: Alert[]; emailEnabled: boolean }>("/alerts"),
    staleTime: 20_000,
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { symbol: string; type: string; threshold: number; note?: string }) => api.post("/alerts", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.alerts }),
  });
}

export function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; threshold?: number; status?: string; note?: string | null }) =>
      api.patch(`/alerts/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.alerts }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.alerts }),
  });
}

export function useEvaluateAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ evaluated: number; triggered: number }>("/alerts/evaluate"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.alerts });
      void qc.invalidateQueries({ queryKey: qk.notifications });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => api.get<{ notifications: Notification[]; unread: number }>("/notifications"),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

/* ── Research ───────────────────────────────────────────────────────── */

export function useRecentlyViewed() {
  return useQuery({
    queryKey: qk.recentlyViewed,
    queryFn: () =>
      api
        .get<{ items: { symbol: string; name: string; viewedAt: string; quote: Quote | null }[] }>("/research/recently-viewed")
        .then((d) => d.items),
    staleTime: 30_000,
  });
}

export function useNotes(symbol?: string) {
  return useQuery({
    queryKey: qk.notes(symbol),
    queryFn: () => api.get<{ notes: ResearchNote[] }>("/research/notes", { query: { symbol } }).then((d) => d.notes),
    staleTime: 20_000,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { symbol: string; title: string; content: string }) => api.post("/research/notes", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["research", "notes"] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/research/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["research", "notes"] }),
  });
}

/* ── Users / settings ───────────────────────────────────────────────── */

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.patch<{ user: User }>("/users/me", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session"] }),
  });
}

export function useUpdatePreferences() {
  return useMutation({
    mutationFn: (prefs: Record<string, unknown>) => api.patch<{ user: User }>("/users/me/preferences", prefs),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) => api.post("/auth/password/change", input),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password: string) => api.delete("/users/me", { body: { password } }),
  });
}

export function exportUserData() {
  return api.get<Record<string, unknown>>("/users/me/export");
}

export type { Candle };
export type QueryOptions<T> = UseQueryOptions<T>;
