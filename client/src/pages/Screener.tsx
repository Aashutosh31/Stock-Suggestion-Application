import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Compass,
  Download,
  Filter,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { DemoBadge, StaleBadge } from "@/components/common/badges";
import { SymbolLink } from "@/components/common/values";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { exportScreenerCsv, useAppMeta, useSaveScreen, useScreener, useScreenerMeta, useScreenerPresets } from "@/hooks/queries";
import type { ScreenerFilters } from "@/hooks/queries";
import { formatCompactNumber, formatCurrency, formatNumber, formatPercent, formatVolume, trendOf } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SortState {
  sortBy: string;
  sortDir: "asc" | "desc";
}

const COLUMNS: { key: string; label: string; align?: "right"; hidden?: string; sortField?: string }[] = [
  { key: "symbol", label: "Instrument", sortField: "symbol" },
  { key: "sector", label: "Sector", hidden: "hidden xl:table-cell" },
  { key: "price", label: "Price", align: "right", sortField: "price" },
  { key: "changePercent", label: "Change", align: "right", sortField: "changePercent" },
  { key: "marketCap", label: "Mkt cap", align: "right", hidden: "hidden lg:table-cell", sortField: "marketCap" },
  { key: "peRatio", label: "P/E", align: "right", hidden: "hidden md:table-cell", sortField: "peRatio" },
  { key: "roe", label: "ROE", align: "right", hidden: "hidden xl:table-cell", sortField: "roe" },
  { key: "return1y", label: "1Y ret", align: "right", hidden: "hidden lg:table-cell", sortField: "return1y" },
  { key: "rsi14", label: "RSI", align: "right", hidden: "hidden xl:table-cell", sortField: "rsi14" },
  { key: "volume", label: "Volume", align: "right", hidden: "hidden 2xl:table-cell", sortField: "volume" },
];

const EMPTY_FILTERS: ScreenerFilters = {};

export default function Screener() {
  const meta = useAppMeta();
  const screenerMeta = useScreenerMeta();
  const presets = useScreenerPresets();
  const saveScreen = useSaveScreen();

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ScreenerFilters>(EMPTY_FILTERS);
  const [preset, setPreset] = useState<string>("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ sortBy: "marketCap", sortDir: "desc" });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [screenName, setScreenName] = useState("");

  useEffect(() => {
    const encoded = searchParams.get("screen");
    if (!encoded) return;
    try {
      const parsed = JSON.parse(decodeURIComponent(encoded)) as Record<string, unknown>;
      const { preset: p, sortBy, sortDir, page: pg, pageSize: _ps, ...rest } = parsed;
      void _ps;
      setFilters(rest as ScreenerFilters);
      if (typeof p === "string") setPreset(p);
      if (typeof sortBy === "string" && typeof sortDir === "string") setSort({ sortBy, sortDir: sortDir as "asc" | "desc" });
      if (typeof pg === "number") setPage(pg);
    } catch {
      // ignore malformed deep links
    }
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryParams = useMemo<ScreenerFilters>(
    () => ({ ...filters, preset: preset || undefined, page, pageSize: 20, sortBy: sort.sortBy, sortDir: sort.sortDir }),
    [filters, preset, page, sort],
  );

  const query = useScreener(queryParams);

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

  const set = (key: string, value: string | number | boolean | undefined) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "" || value === false) delete next[key];
      else next[key] = value;
      return next;
    });
    setPage(1);
  };

  const toggleSort = (field: string) => {
    setSort((prev) => (prev.sortBy === field ? { sortBy: field, sortDir: prev.sortDir === "desc" ? "asc" : "desc" } : { sortBy: field, sortDir: "desc" }));
    setPage(1);
  };

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setPreset("");
    setSort({ sortBy: "marketCap", sortDir: "desc" });
    setPage(1);
  };

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Screener"
        description={
          <span className="flex items-center gap-2">
            Filter the NSE/BSE universe on fundamentals and technicals, then export the result.
            {meta.data ? <DemoBadge demo={meta.data.provider.demo} /> : null}
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setAdvancedOpen(true)}>
              <Filter /> Filters
              {activeFilterCount > 0 ? <Badge variant="brand">{activeFilterCount}</Badge> : null}
            </Button>
            <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Bookmark /> Save
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Save this screen</DialogTitle>
                  <DialogDescription>Store the current filters so you can rerun them later.</DialogDescription>
                </DialogHeader>
                <Field label="Screen name">
                  <Input value={screenName} onChange={(e) => setScreenName(e.target.value)} placeholder="Quality compounders" />
                </Field>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setSaveOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    loading={saveScreen.isPending}
                    disabled={!screenName.trim()}
                    onClick={() =>
                      saveScreen.mutate(
                        { name: screenName.trim(), filters: queryParams },
                        {
                          onSuccess: () => {
                            toast.success("Screen saved");
                            setSaveOpen(false);
                            setScreenName("");
                          },
                          onError: () => toast.error("Could not save screen"),
                        },
                      )
                    }
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={() =>
                exportScreenerCsv(queryParams)
                  .then(() => toast.success("Export started"))
                  .catch(() => toast.error("Export failed"))
              }
            >
              <Download /> CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted">Presets:</span>
        <Button
          variant={preset === "" ? "subtle" : "ghost"}
          size="sm"
          onClick={() => {
            setPreset("");
            setPage(1);
          }}
        >
          All
        </Button>
        {(presets.data ?? []).map((p) => (
          <Button
            key={p.id}
            variant={preset === p.id ? "subtle" : "ghost"}
            size="sm"
            title={p.description}
            onClick={() => {
              setPreset(p.id);
              setPage(1);
            }}
          >
            {p.name}
          </Button>
        ))}
      </div>

      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(filters).map(([key, value]) => (
            <Badge key={key} variant="neutral" className="gap-1">
              {key}: {String(value)}
              <button onClick={() => set(key, undefined)} aria-label={`Remove ${key}`} className="cursor-pointer">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" /> Clear
          </Button>
        </div>
      ) : null}

      <Async
        query={query}
        loading={
          <Card>
            <CardContent className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        }
        empty={(d) => d.results.length === 0}
        emptyTitle="No matches"
        emptyDescription="Loosen your filters or pick a different preset."
      >
        {(data) => (
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-line px-5 py-3 text-xs text-muted">
                <span className="flex items-center gap-2">
                  <Compass className="size-3.5 text-brand" /> {data.total} matches
                </span>
                <span>Page {data.page} of {data.totalPages}</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((col) => (
                      <TableHead key={col.key} className={cn(col.align === "right" && "text-right", col.hidden)}>
                        {col.sortField ? (
                          <button
                            className="inline-flex cursor-pointer items-center gap-1 hover:text-ink"
                            onClick={() => toggleSort(col.sortField!)}
                          >
                            {col.label}
                            {sort.sortBy === col.sortField ? (
                              sort.sortDir === "desc" ? (
                                <ArrowDown className="size-3" />
                              ) : (
                                <ArrowUp className="size-3" />
                              )
                            ) : null}
                          </button>
                        ) : (
                          col.label
                        )}
                      </TableHead>
                    ))}
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.results.map((row) => (
                    <TableRow key={row.symbol}>
                      <TableCell>
                        <SymbolLink symbol={row.symbol} name={row.name} showName />
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted xl:table-cell">{row.sector ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm tnum text-ink">{formatCurrency(row.price)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn("text-sm tnum", trendOf(row.changePercent) === "up" ? "text-up" : trendOf(row.changePercent) === "down" ? "text-down" : "text-muted")}>
                          {formatPercent(row.changePercent, { sign: true })}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right text-sm tnum text-muted lg:table-cell">
                        {row.marketCap != null ? `₹${formatCompactNumber(row.marketCap)}` : "—"}
                      </TableCell>
                      <TableCell className="hidden text-right text-sm tnum text-muted md:table-cell">{row.peRatio != null ? formatNumber(row.peRatio, 1) : "—"}</TableCell>
                      <TableCell className="hidden text-right text-sm tnum text-muted xl:table-cell">{row.roe != null ? formatPercent(row.roe, { decimals: 1 }) : "—"}</TableCell>
                      <TableCell className={cn("hidden text-right text-sm tnum lg:table-cell", trendOf(row.return1y) === "up" ? "text-up" : trendOf(row.return1y) === "down" ? "text-down" : "text-muted")}>
                        {formatPercent(row.return1y, { sign: true })}
                      </TableCell>
                      <TableCell className="hidden text-right text-sm tnum text-muted xl:table-cell">{row.rsi14 != null ? formatNumber(row.rsi14, 1) : "—"}</TableCell>
                      <TableCell className="hidden text-right text-sm tnum text-muted 2xl:table-cell">{formatVolume(row.volume)}</TableCell>
                      <TableCell className="text-right">
                        {row.stale ? <StaleBadge stale /> : row.dataAvailability < 60 ? <Badge variant="warn">{row.dataAvailability}%</Badge> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.results.length === 0 ? <EmptyState title="No matches" className="border-0" /> : null}
              <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
                <span>{data.total} results</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={data.page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </Async>

      <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="size-4 text-brand" /> Advanced filters
            </DialogTitle>
            <DialogDescription>Combine valuation, quality, momentum and technical conditions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Search">
              <Input placeholder="Symbol or name" value={String(filters.search ?? "")} onChange={(e) => set("search", e.target.value)} />
            </Field>
            <Field label="Exchange">
              <Select value={String(filters.exchange ?? "")} onChange={(e) => set("exchange", e.target.value)}>
                <option value="">Any</option>
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
              </Select>
            </Field>
            <Field label="Index membership">
              <Select value={String(filters.index ?? "")} onChange={(e) => set("index", e.target.value)}>
                <option value="">Any</option>
                {(screenerMeta.data?.indices ?? []).map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sector">
              <Select value={String(filters.sectors ?? "")} onChange={(e) => set("sectors", e.target.value)}>
                <option value="">Any</option>
                {(screenerMeta.data?.sectors ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <NumField label="Price ≥" value={filters.priceMin} onChange={(v) => set("priceMin", v)} />
            <NumField label="Price ≤" value={filters.priceMax} onChange={(v) => set("priceMax", v)} />
            <NumField label="Market cap ≥" value={filters.marketCapMin} onChange={(v) => set("marketCapMin", v)} />
            <NumField label="P/E ≤" value={filters.peMax} onChange={(v) => set("peMax", v)} />
            <NumField label="P/B ≤" value={filters.pbMax} onChange={(v) => set("pbMax", v)} />
            <NumField label="ROE ≥ (%)" value={filters.roeMin} onChange={(v) => set("roeMin", v)} />
            <NumField label="Debt/Equity ≤" value={filters.debtToEquityMax} onChange={(v) => set("debtToEquityMax", v)} />
            <NumField label="Dividend yield ≥ (%)" value={filters.dividendYieldMin} onChange={(v) => set("dividendYieldMin", v)} />
            <NumField label="Revenue growth ≥ (%)" value={filters.revenueGrowthMin} onChange={(v) => set("revenueGrowthMin", v)} />
            <NumField label="Earnings growth ≥ (%)" value={filters.earningsGrowthMin} onChange={(v) => set("earningsGrowthMin", v)} />
            <NumField label="3M return ≥ (%)" value={filters.return3mMin} onChange={(v) => set("return3mMin", v)} />
            <NumField label="1Y return ≥ (%)" value={filters.return1yMin} onChange={(v) => set("return1yMin", v)} />
            <NumField label="RSI ≥" value={filters.rsiMin} onChange={(v) => set("rsiMin", v)} />
            <NumField label="RSI ≤" value={filters.rsiMax} onChange={(v) => set("rsiMax", v)} />
            <NumField label="Volatility ≤ (%)" value={filters.volatilityMax} onChange={(v) => set("volatilityMax", v)} />
            <NumField label="Volume ratio ≥" value={filters.volumeRatioMin} onChange={(v) => set("volumeRatioMin", v)} />
          </div>

          <div className="flex flex-wrap gap-5 border-t border-line pt-4">
            <label className="flex items-center gap-2 text-xs text-muted">
              <Switch checked={Boolean(filters.aboveSma50)} onCheckedChange={(v) => set("aboveSma50", v)} /> Above SMA-50
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <Switch checked={Boolean(filters.aboveSma200)} onCheckedChange={(v) => set("aboveSma200", v)} /> Above SMA-200
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <Switch checked={Boolean(filters.goldenCross)} onCheckedChange={(v) => set("goldenCross", v)} /> Golden cross
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <Switch checked={Boolean(filters.excludeStale)} onCheckedChange={(v) => set("excludeStale", v)} /> Exclude delayed data
            </label>
            <Field label="Trend" className="w-40">
              <Select value={String(filters.trend ?? "")} onChange={(e) => set("trend", e.target.value)}>
                <option value="">Any</option>
                <option value="up">Up</option>
                <option value="sideways">Sideways</option>
                <option value="down">Down</option>
              </Select>
            </Field>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={reset}>
              Reset
            </Button>
            <Button onClick={() => setAdvancedOpen(false)}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-center text-xs text-subtle">
        Tip: press <kbd className="rounded border border-line px-1">⌘K</kbd> to jump to an instrument.{" "}
        <Link to="/tools" className="text-brand hover:underline">
          Learn how metrics are computed
        </Link>
        .
      </p>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: unknown; onChange: (v: number | undefined) => void }) {
  return (
    <Field label={label}>
      <Input
        type="number"
        inputMode="decimal"
        value={value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        placeholder="—"
      />
    </Field>
  );
}
