import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { GitCompareArrows, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { DemoBadge } from "@/components/common/badges";
import { SymbolLink } from "@/components/common/values";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/feedback";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useCompare, useSearch } from "@/hooks/queries";
import type { History } from "@/lib/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCompactNumber, formatCurrency, formatNumber, formatPercent, trendOf } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX = 6;

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const initial = (params.get("symbols") ?? "RELIANCE,TCS,INFY").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const [symbols, setSymbols] = useState<string[]>(initial.slice(0, MAX));
  const [term, setTerm] = useState("");
  const debounced = useDebouncedValue(term, 220);
  const suggestions = useSearch(debounced, 6);

  useEffect(() => {
    setParams(symbols.length ? { symbols: symbols.join(",") } : {}, { replace: true });
  }, [symbols, setParams]);

  const compare = useCompare(symbols);

  const historyQueries = useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: qk.history(symbol, "1y", "1d"),
      queryFn: () => api.get<{ history: History }>(`/stocks/${symbol}/history`, { query: { range: "1y", interval: "1d" } }).then((d) => d.history),
      staleTime: 60_000,
    })),
  });

  const chartSeries = useMemo(
    () =>
      historyQueries
        .map((q, i) => ({ label: symbols[i], candles: q.data?.candles ?? [] }))
        .filter((s) => s.candles.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyQueries.map((q) => q.dataUpdatedAt).join(","), symbols.join(",")],
  );

  const add = (symbol: string) => {
    const s = symbol.trim().toUpperCase();
    if (!s || symbols.includes(s) || symbols.length >= MAX) return;
    setSymbols((prev) => [...prev, s]);
    setTerm("");
  };

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Compare"
        description="Put up to six instruments side by side on valuation, quality, momentum and relative performance."
        actions={<DemoBadge demo={false} />}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {symbols.map((s) => (
              <Badge key={s} variant="neutral" className="gap-1.5 py-1">
                <SymbolLink symbol={s} className="text-ink" />
                <button
                  className="cursor-pointer"
                  onClick={() => setSymbols((prev) => prev.filter((x) => x !== s))}
                  aria-label={`Remove ${s}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {symbols.length < MAX ? (
              <div className="relative">
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add(term)}
                  placeholder="Add symbol…"
                  className="h-8 w-40"
                />
                {term && suggestions.data && suggestions.data.length > 0 ? (
                  <ul className="absolute z-20 mt-1 w-56 overflow-hidden rounded-md border border-line bg-surface shadow-[var(--nv-shadow)]">
                    {suggestions.data.map((s) => (
                      <li key={s.symbol}>
                        <button
                          className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-surface-2"
                          onClick={() => add(s.symbol)}
                        >
                          <span className="font-medium text-ink">{s.symbol}</span>
                          <span className="truncate text-[10px] text-subtle">{s.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <span className="text-xs text-subtle">Maximum {MAX} instruments</span>
            )}
          </div>
        </CardContent>
      </Card>

      {symbols.length < 2 ? (
        <EmptyState icon={GitCompareArrows} title="Select at least two instruments" description="Add symbols above to build a comparison." />
      ) : (
        <Async query={compare} loading={<Skeleton className="h-72" />} empty={() => false}>
          {(rows) => (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Normalised performance (1Y, rebased to 0%)</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartSeries.length === 0 ? (
                    <EmptyState title="No history available" />
                  ) : (
                    <MultiLineChart series={chartSeries} />
                  )}
                </CardContent>
              </Card>

              <Card className="mt-5">
                <CardHeader>
                  <CardTitle>Side-by-side metrics</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-line">
                          <th className="h-9 px-4 text-left text-[11px] font-semibold uppercase tracking-wide text-subtle">Metric</th>
                          {rows.map((r) => (
                            <th key={r.symbol} className="h-9 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-subtle">
                              <Link to={`/stocks/${r.symbol}`} className="text-muted hover:text-brand">
                                {r.symbol}
                              </Link>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <CompareRow label="Price" values={rows.map((r) => formatCurrency(r.quote?.price))} />
                        <CompareRow
                          label="Day change"
                          values={rows.map((r) => formatPercent(r.quote?.changePercent, { sign: true }))}
                          tones={rows.map((r) => trendOf(r.quote?.changePercent))}
                        />
                        <CompareRow label="Market cap" values={rows.map((r) => (r.fundamentals?.marketCap != null ? `₹${formatCompactNumber(r.fundamentals.marketCap)}` : "—"))} />
                        <CompareRow label="P/E" values={rows.map((r) => num(r.fundamentals?.peRatio, 1))} />
                        <CompareRow label="P/B" values={rows.map((r) => num(r.fundamentals?.pbRatio, 2))} />
                        <CompareRow label="ROE" values={rows.map((r) => pct(r.fundamentals?.roe))} />
                        <CompareRow label="ROCE" values={rows.map((r) => pct(r.fundamentals?.roce))} />
                        <CompareRow label="Debt/Equity" values={rows.map((r) => num(r.fundamentals?.debtToEquity, 2))} />
                        <CompareRow label="Dividend yield" values={rows.map((r) => pct(r.fundamentals?.dividendYield))} />
                        <CompareRow
                          label="1Y return"
                          values={rows.map((r) => formatPercent(r.technical?.return1y, { sign: true }))}
                          tones={rows.map((r) => trendOf(r.technical?.return1y))}
                        />
                        <CompareRow label="RSI (14)" values={rows.map((r) => num(r.technical?.rsi14, 1))} />
                        <CompareRow label="Volatility" values={rows.map((r) => pct(r.technical?.volatility))} />
                        <CompareRow
                          label="Trend"
                          values={rows.map((r) => r.technical?.trend ?? "—")}
                          tones={rows.map((r) => (r.technical?.trend === "up" ? "up" : r.technical?.trend === "down" ? "down" : "flat"))}
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </Async>
      )}

      {symbols.length >= 2 && symbols.length < MAX ? (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => add("NIFTY50")}>
            <Plus className="size-3.5" /> Add NIFTY 50 style proxy
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function num(value: number | null | undefined, decimals: number): string {
  return value == null ? "—" : formatNumber(value, decimals);
}
function pct(value: number | null | undefined): string {
  return value == null ? "—" : formatPercent(value);
}

function CompareRow({ label, values, tones }: { label: string; values: string[]; tones?: ("up" | "down" | "flat")[] }) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-2.5 text-xs text-muted">{label}</td>
      {values.map((value, i) => {
        const tone = tones?.[i];
        return (
          <td key={i} className={cn("px-4 py-2.5 text-right text-sm tnum", tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink")}>
            {value}
          </td>
        );
      })}
    </tr>
  );
}
