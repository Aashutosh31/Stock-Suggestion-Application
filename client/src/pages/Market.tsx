import { useMemo, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { DemoBadge, StaleBadge } from "@/components/common/badges";
import { ChangePill, PriceCell, SymbolLink } from "@/components/common/values";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, StatBlock } from "@/components/ui/feedback";
import { useAppMeta, useIndices, useMarketStatus, useProviderHealth, useUniverse } from "@/hooks/queries";
import { useBulkQuotes } from "@/hooks/useBulkQuotes";
import { formatNumber, formatPercent, timeAgo, trendOf } from "@/lib/format";

const PAGE_SIZE = 20;

export default function Market() {
  const meta = useAppMeta();
  const status = useMarketStatus();
  const indices = useIndices();
  const health = useProviderHealth();
  const universe = useUniverse();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = universe.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((i) => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || (i.sector ?? "").toLowerCase().includes(q));
  }, [universe.data, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const quotes = useBulkQuotes(pageRows.map((r) => r.symbol));
  const quoteMap = useMemo(() => new Map((quotes.data ?? []).map((q) => [q.symbol, q])), [quotes.data]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Market"
        description={
          <span className="flex items-center gap-2">
            Live index levels, provider status and the full instrument universe.
            {meta.data ? <DemoBadge demo={meta.data.provider.demo} /> : null}
          </span>
        }
        actions={
          <Button variant="outline" onClick={() => { void indices.refetch(); void health.refetch(); void quotes.refetch(); }}>
            <RefreshCw /> Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Async query={indices} loading={<Skeleton className="h-28 sm:col-span-2 lg:col-span-3" />}>
          {(list) =>
            list.length === 0 ? (
              <EmptyState className="sm:col-span-2 lg:col-span-3" title="No index data" />
            ) : (
              <>
                {list.map((idx) => {
                  const t = trendOf(idx.changePercent);
                  return (
                    <Card key={idx.symbol} id={idx.symbol}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-ink">{idx.name}</p>
                            <StaleBadge stale={idx.stale} timestamp={idx.timestamp} />
                          </div>
                          <p className="text-[11px] text-subtle">{idx.symbol}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg font-semibold tnum text-ink">{formatNumber(idx.value, 2)}</p>
                          <p className={t === "up" ? "text-xs tnum text-up" : t === "down" ? "text-xs tnum text-down" : "text-xs tnum text-muted"}>
                            {formatNumber(idx.change, 2)} ({formatPercent(idx.changePercent, { sign: true })})
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )
          }
        </Async>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Async query={status} loading={<Skeleton className="h-24" />}>
          {(s) => (
            <StatBlock
              label="Market session"
              value={s.state.replace("_", " ")}
              hint={`${s.timezone} · next open ${new Date(s.nextOpen).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}`}
              valueClassName={s.state === "OPEN" ? "text-up" : s.state === "CLOSED" ? "text-muted" : "text-warn"}
            />
          )}
        </Async>
        <Async query={meta} loading={<Skeleton className="h-24" />}>
          {(m) => (
            <StatBlock
              label="Data provider"
              value={<span className="flex items-center gap-2 text-base">{m.provider.label}{m.provider.demo ? <Badge variant="warn">Demo</Badge> : <Badge variant="up">Live</Badge>}</span>}
              hint={`${m.filters.sectors.length} sectors · ${m.filters.industries.length} industries`}
            />
          )}
        </Async>
        <Async query={health} loading={<Skeleton className="h-24" />}>
          {(h) => (
            <StatBlock
              label="Provider health"
              value={<span className="capitalize">{h.health.status}</span>}
              valueClassName={h.health.status === "ok" ? "text-up" : h.health.status === "degraded" ? "text-warn" : "text-down"}
              hint={`${h.health.latencyMs ?? "—"} ms · checked ${timeAgo(h.health.checkedAt)}`}
            />
          )}
        </Async>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4 text-brand" /> Instrument universe
            <Badge variant="neutral">{filtered.length}</Badge>
          </CardTitle>
          <div className="w-full max-w-xs">
            <Input placeholder="Filter by symbol, name or sector…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instrument</TableHead>
                <TableHead className="hidden md:table-cell">Sector</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Day range</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.isLoading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : pageRows.map((instrument) => {
                    const q = quoteMap.get(instrument.symbol);
                    return (
                      <TableRow key={instrument.symbol}>
                        <TableCell>
                          <SymbolLink symbol={instrument.symbol} name={instrument.name} showName />
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted md:table-cell">{instrument.sector ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <PriceCell price={q?.price} currency />
                        </TableCell>
                        <TableCell className="text-right">
                          <ChangePill value={q?.changePercent} size="sm" />
                        </TableCell>
                        <TableCell className="hidden text-right text-xs tnum text-muted lg:table-cell">
                          {q?.low != null && q?.high != null ? `${formatNumber(q.low)} – ${formatNumber(q.high)}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {q?.stale ? <StaleBadge stale timestamp={q.timestamp} /> : <Badge variant="outline">{instrument.exchange}</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
          {!quotes.isLoading && pageRows.length === 0 ? (
            <EmptyState title="No instruments match" description="Try a different search term." className="border-0" />
          ) : null}
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
            <span>
              Page {current} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
