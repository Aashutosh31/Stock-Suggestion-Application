import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Building2,
  ExternalLink,
  GitCompareArrows,
  LineChart as LineChartIcon,
  NotebookPen,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Async } from "@/components/common/Async";
import { DemoBadge, StaleBadge } from "@/components/common/badges";
import { PriceChart } from "@/components/charts/PriceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/primitives";
import { EmptyState, StatBlock } from "@/components/ui/feedback";
import { InfoTip } from "@/components/ui/tooltip";
import {
  useAddWatchlistItem,
  useCreateAlert,
  useCreateNote,
  useDeleteNote,
  useNotes,
  usePlacePaperOrder,
  useStockDetail,
  useStockHistory,
  useStockIndicators,
  useWatchlists,
} from "@/hooks/queries";
import type { Fundamentals, TechnicalSnapshot } from "@/lib/types";
import { formatCompactNumber, formatCurrency, formatDate, formatNumber, formatPercent, formatVolume, timeAgo, trendOf } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = ["5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"] as const;
const INTRADAY_RANGES = new Set(["1d", "5d"]);

export default function StockDetail() {
  const { symbol = "" } = useParams();
  const detail = useStockDetail(symbol);
  const [range, setRange] = useState<string>("6mo");
  const [interval, setInterval] = useState<string>("1d");
  const [overlays, setOverlays] = useState({ sma20: true, sma50: true, sma200: false, bollinger: false });

  const history = useStockHistory(symbol, range, interval);
  const indicators = useStockIndicators(symbol, range, interval);

  const watchlists = useWatchlists();
  const addItem = useAddWatchlistItem();
  const createAlert = useCreateAlert();
  const paperOrder = usePlacePaperOrder();
  const notes = useNotes(symbol);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const quote = detail.data?.quote;
  const t = trendOf(quote?.changePercent);
  const firstWatchlist = watchlists.data?.[0];

  const candles = history.data?.candles ?? [];
  const indicatorData = indicators.data?.series ?? [];

  const changeRange = (value: string) => {
    setRange(value);
    if (INTRADAY_RANGES.has(value) && interval === "1d") setInterval("15m");
    if (!INTRADAY_RANGES.has(value) && interval !== "1d" && interval !== "1wk" && interval !== "1mo") setInterval("1d");
  };

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center gap-2 text-xs text-subtle">
        <Link to="/market" className="inline-flex items-center gap-1 hover:text-muted">
          <ArrowLeft className="size-3" /> Market
        </Link>
        <span>/</span>
        <span className="text-muted">{symbol}</span>
      </div>

      <Async query={detail} loading={<Skeleton className="h-28 w-full" />}>
        {(data) => (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-semibold text-ink">{data.instrument.symbol}</h1>
                  <Badge variant="outline">{data.instrument.exchange}</Badge>
                  {data.instrument.sector ? <Badge variant="neutral">{data.instrument.sector}</Badge> : null}
                  <DemoBadge demo={data.source.demo} />
                  <StaleBadge stale={Boolean(quote?.stale)} timestamp={quote?.timestamp} />
                </div>
                <p className="mt-0.5 text-sm text-muted">{data.instrument.name}</p>
                {data.instrument.indexMemberships && data.instrument.indexMemberships.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {data.instrument.indexMemberships.map((idx) => (
                      <Badge key={idx} variant="info" size="sm">
                        {idx}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-1">
                <p className="font-display text-3xl font-semibold tnum text-ink">{formatCurrency(quote?.price)}</p>
                <p className={cn("text-sm tnum", t === "up" ? "text-up" : t === "down" ? "text-down" : "text-muted")}>
                  {formatNumber(quote?.change, 2)} ({formatPercent(quote?.changePercent, { sign: true })})
                </p>
                <p className="text-[11px] text-subtle">
                  {data.marketStatus.state.replace("_", " ")} · {quote ? `updated ${timeAgo(quote.timestamp)}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {firstWatchlist ? (
                <Button
                  variant="outline"
                  size="sm"
                  loading={addItem.isPending}
                  onClick={() =>
                    addItem.mutate(
                      { id: firstWatchlist.id, symbol: data.instrument.symbol },
                      {
                        onSuccess: () => toast.success(`Added to ${firstWatchlist.name}`),
                        onError: () => toast.message("Already in watchlist"),
                      },
                    )
                  }
                >
                  <Star className="size-3.5" /> Add to watchlist
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                loading={createAlert.isPending}
                onClick={() =>
                  createAlert.mutate(
                    { symbol: data.instrument.symbol, type: "price_above", threshold: (quote?.price ?? 0) * 1.05 },
                    {
                      onSuccess: () => toast.success("Alert created at +5% above current price"),
                      onError: () => toast.error("Could not create alert"),
                    },
                  )
                }
              >
                <Bell className="size-3.5" /> Alert at +5%
              </Button>
              <Button
                variant="outline"
                size="sm"
                loading={paperOrder.isPending}
                onClick={() =>
                  paperOrder.mutate(
                    { symbol: data.instrument.symbol, side: "buy", quantity: 1 },
                    {
                      onSuccess: () => toast.success("Bought 1 share in the paper account"),
                      onError: (err) => toast.error(err instanceof Error ? err.message : "Order failed"),
                    },
                  )
                }
              >
                <Plus className="size-3.5" /> Paper buy 1
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/compare?symbols=${data.instrument.symbol}`}>
                  <GitCompareArrows className="size-3.5" /> Compare
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatBlock label="Open" value={formatCurrency(quote?.open)} />
              <StatBlock label="Prev close" value={formatCurrency(quote?.previousClose)} />
              <StatBlock label="Day high" value={formatCurrency(quote?.high)} />
              <StatBlock label="Day low" value={formatCurrency(quote?.low)} />
              <StatBlock label="Volume" value={formatVolume(quote?.volume)} />
              <StatBlock label="52w range" value={
                data.fundamentals?.low52w != null && data.fundamentals?.high52w != null
                  ? <span className="text-sm">{formatNumber(data.fundamentals.low52w, 0)} – {formatNumber(data.fundamentals.high52w, 0)}</span>
                  : "—"
              } />
            </div>

            <Card>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="size-4 text-brand" /> Price chart
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={range} onChange={(e) => changeRange(e.target.value)} className="h-8 w-24 text-xs">
                    {RANGES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                  <Select value={interval} onChange={(e) => setInterval(e.target.value)} className="h-8 w-28 text-xs">
                    {["5m", "15m", "1h", "1d", "1wk", "1mo"].map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                  <label className="flex items-center gap-2">
                    <Switch checked={overlays.sma20} onCheckedChange={(v) => setOverlays((o) => ({ ...o, sma20: v }))} /> SMA-20
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch checked={overlays.sma50} onCheckedChange={(v) => setOverlays((o) => ({ ...o, sma50: v }))} /> SMA-50
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch checked={overlays.sma200} onCheckedChange={(v) => setOverlays((o) => ({ ...o, sma200: v }))} /> SMA-200
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch checked={overlays.bollinger} onCheckedChange={(v) => setOverlays((o) => ({ ...o, bollinger: v }))} /> Bollinger
                  </label>
                </div>
                {history.isLoading ? (
                  <Skeleton className="h-[380px] w-full" />
                ) : candles.length === 0 ? (
                  <EmptyState title="No price history" description="The provider returned no candles for this range and interval." />
                ) : (
                  <PriceChart candles={candles} indicators={indicatorData} overlays={overlays} showVolume height={380} />
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="overview">
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
                <TabsTrigger value="technicals">Technicals</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="size-4 text-brand" /> Company profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted">
                    {data.profile ? (
                      <>
                        <p className="leading-relaxed">{data.profile.description ?? "No description available from the provider."}</p>
                        <Separator />
                        <dl className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <dt className="text-subtle">Industry</dt>
                            <dd className="text-ink">{data.profile.industry ?? data.instrument.industry ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-subtle">Country</dt>
                            <dd className="text-ink">{data.profile.country ?? "India"}</dd>
                          </div>
                          <div>
                            <dt className="text-subtle">Employees</dt>
                            <dd className="text-ink tnum">{data.profile.employees ? formatNumber(data.profile.employees, 0) : "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-subtle">Website</dt>
                            <dd>
                              {data.profile.website ? (
                                <a href={data.profile.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-brand hover:underline">
                                  Visit <ExternalLink className="size-3" />
                                </a>
                              ) : (
                                "—"
                              )}
                            </dd>
                          </div>
                        </dl>
                      </>
                    ) : (
                      <p>The provider did not return a company profile for this instrument.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key valuation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-sm">
                    <MetricRow label="Market cap" value={data.fundamentals?.marketCap != null ? `₹${formatCompactNumber(data.fundamentals.marketCap)}` : "—"} />
                    <MetricRow label="P/E" value={fmt(data.fundamentals?.peRatio, 1)} />
                    <MetricRow label="P/B" value={fmt(data.fundamentals?.pbRatio, 2)} />
                    <MetricRow label="Dividend yield" value={data.fundamentals?.dividendYield != null ? formatPercent(data.fundamentals.dividendYield) : "—"} />
                    <MetricRow label="Beta" value={fmt(data.fundamentals?.beta, 2)} />
                    <p className="pt-1 text-[11px] text-subtle">
                      Fundamentals as of {data.fundamentals?.asOf ? formatDate(data.fundamentals.asOf) : "n/a"} · source {data.source.label}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fundamentals">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Fundamentals</CardTitle>
                    {(!data.fundamentals || data.fundamentals.marketCap == null) ? (
                      <Badge variant="warn">Limited data from provider</Badge>
                    ) : null}
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {(Object.entries(fundamentalItems(data.fundamentals)) as [string, string][]).map(([label, value]) => (
                      <div key={label} className="rounded-md border border-line bg-surface-2 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-subtle">{label}</p>
                        <p className="mt-1 text-sm font-medium tnum text-ink">{value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technicals">
                <Async query={indicators} loading={<Skeleton className="h-64" />} empty={() => false}>
                  {(payload) => <TechnicalPanel snapshot={payload.snapshot} />}
                </Async>
              </TabsContent>

              <TabsContent value="notes">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <NotebookPen className="size-4 text-brand" /> New research note
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input placeholder="Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
                      <Textarea
                        placeholder="Thesis, catalysts, risks…"
                        rows={5}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                      />
                      <Button
                        disabled={!noteTitle.trim() || !noteContent.trim()}
                        loading={createNote.isPending}
                        onClick={() =>
                          createNote.mutate(
                            { symbol, title: noteTitle.trim(), content: noteContent.trim() },
                            {
                              onSuccess: () => {
                                toast.success("Note saved");
                                setNoteTitle("");
                                setNoteContent("");
                              },
                              onError: () => toast.error("Could not save note"),
                            },
                          )
                        }
                      >
                        Save note
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Notes on {symbol}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Async query={notes} loading={<Skeleton className="h-32" />} empty={(n) => n.length === 0} emptyTitle="No notes yet">
                        {(list) => (
                          <ul className="space-y-3">
                            {list.map((note) => (
                              <li key={note._id} className="rounded-md border border-line bg-surface-2 p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-ink">{note.title}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => deleteNote.mutate(note._id, { onSuccess: () => toast.success("Note deleted") })}
                                    aria-label="Delete note"
                                  >
                                    <Trash2 className="size-3.5 text-down" />
                                  </Button>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{note.content}</p>
                                <p className="mt-2 text-[10px] text-subtle">{timeAgo(note.createdAt)}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Async>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </Async>
    </div>
  );
}

function fmt(value: number | null | undefined, decimals: number): string {
  return value == null ? "—" : formatNumber(value, decimals);
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted">{label}</span>
      <span className="tnum text-ink">{value}</span>
    </div>
  );
}

function fundamentalItems(f: Fundamentals | null): Record<string, string> {
  if (!f) return { Status: "Unavailable" };
  return {
    "Market cap": f.marketCap != null ? `₹${formatCompactNumber(f.marketCap)}` : "—",
    "P/E": fmt(f.peRatio, 1),
    "P/B": fmt(f.pbRatio, 2),
    EPS: fmt(f.eps, 2),
    "ROE": f.roe != null ? formatPercent(f.roe) : "—",
    "ROCE": f.roce != null ? formatPercent(f.roce) : "—",
    "Debt/Equity": fmt(f.debtToEquity, 2),
    "Dividend yield": f.dividendYield != null ? formatPercent(f.dividendYield) : "—",
    Revenue: f.revenue != null ? `₹${formatCompactNumber(f.revenue)}` : "—",
    "Net income": f.netIncome != null ? `₹${formatCompactNumber(f.netIncome)}` : "—",
    "Revenue growth": f.revenueGrowth != null ? formatPercent(f.revenueGrowth) : "—",
    "Earnings growth": f.earningsGrowth != null ? formatPercent(f.earningsGrowth) : "—",
    "Book value": fmt(f.bookValue, 2),
    "Face value": fmt(f.faceValue, 2),
    "52w high": fmt(f.high52w, 2),
    "52w low": fmt(f.low52w, 2),
    Beta: fmt(f.beta, 2),
  };
}

const TECH_ITEMS: { key: keyof TechnicalSnapshot; label: string; suffix?: string; decimals?: number }[] = [
  { key: "rsi14", label: "RSI (14)", decimals: 1 },
  { key: "macd", label: "MACD", decimals: 2 },
  { key: "macdSignal", label: "MACD signal", decimals: 2 },
  { key: "macdHistogram", label: "MACD histogram", decimals: 2 },
  { key: "sma20", label: "SMA 20", decimals: 2 },
  { key: "sma50", label: "SMA 50", decimals: 2 },
  { key: "sma200", label: "SMA 200", decimals: 2 },
  { key: "return1m", label: "1M return", suffix: "%", decimals: 2 },
  { key: "return3m", label: "3M return", suffix: "%", decimals: 2 },
  { key: "return1y", label: "1Y return", suffix: "%", decimals: 2 },
  { key: "volatility", label: "Volatility (ann.)", suffix: "%", decimals: 1 },
  { key: "maxDrawdown", label: "Max drawdown", suffix: "%", decimals: 1 },
  { key: "volumeRatio", label: "Volume ratio", decimals: 2 },
];

function TechnicalPanel({ snapshot }: { snapshot: TechnicalSnapshot }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Technical snapshot</CardTitle>
        <Badge variant={snapshot.trend === "up" ? "up" : snapshot.trend === "down" ? "down" : "neutral"} className="capitalize">
          {snapshot.trend} trend
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TECH_ITEMS.map((item) => {
            const value = snapshot[item.key] as number | null;
            const isReturn = item.suffix === "%";
            const tone = isReturn && value != null ? (value >= 0 ? "text-up" : "text-down") : "text-ink";
            return (
              <div key={item.key} className="rounded-md border border-line bg-surface-2 p-3">
                <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-subtle">
                  {item.label}
                  {item.key === "volatility" ? <InfoTip content="Annualised standard deviation of daily returns over the lookback window." /> : null}
                  {item.key === "maxDrawdown" ? <InfoTip content="Largest peak-to-trough decline within the lookback window." /> : null}
                </p>
                <p className={cn("mt-1 text-sm font-medium tnum", tone)}>
                  {value == null ? "—" : `${formatNumber(value, item.decimals ?? 2)}${item.suffix ?? ""}`}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
