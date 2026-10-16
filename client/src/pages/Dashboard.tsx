import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Newspaper,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { ChangePill, SymbolLink } from "@/components/common/values";
import { DemoBadge } from "@/components/common/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading, StatBlock } from "@/components/ui/feedback";
import { AllocationDonut } from "@/components/charts/AllocationDonut";
import { useCurrentUser } from "@/hooks/useAuth";
import {
  useAllocation,
  useAppMeta,
  useHoldings,
  useIndices,
  useNews,
  usePortfolios,
  useRecentlyViewed,
  useSuggestions,
  useWatchlists,
} from "@/hooks/queries";
import { formatCurrency, formatNumber, formatPercent, timeAgo, trendOf, formatDate } from "@/lib/format";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const user = useCurrentUser();
  const meta = useAppMeta();
  const indices = useIndices();
  const portfolios = usePortfolios();
  const suggestions = useSuggestions({ limit: 6 });
  const watchlists = useWatchlists();
  const recent = useRecentlyViewed();
  const news = useNews(undefined, 6);

  const defaultPortfolio = portfolios.data?.find((p) => p.isDefault) ?? portfolios.data?.[0];
  const holdings = useHoldings(defaultPortfolio?.id);
  const allocation = useAllocation(defaultPortfolio?.id);
  const primaryWatchlist = watchlists.data?.[0];

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title={`${greeting()}${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description={
          <span className="flex items-center gap-2">
            {formatDate(new Date(), "EEEE, dd MMM yyyy")} · Research overview
            {meta.data ? <DemoBadge demo={meta.data.provider.demo} /> : null}
          </span>
        }
        actions={
          <Button asChild>
            <Link to="/suggestions">
              <Sparkles /> View suggestions
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {indices.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : indices.data?.slice(0, 4).map((idx) => {
              const t = trendOf(idx.changePercent);
              return (
                <StatBlock
                  key={idx.symbol}
                  label={idx.name}
                  value={formatNumber(idx.value, 2)}
                  valueClassName={t === "up" ? "text-up" : t === "down" ? "text-down" : "text-ink"}
                  hint={
                    <span className="flex items-center gap-1.5">
                      <ChangePill value={idx.changePercent} size="sm" />
                      <span className="text-[10px] text-subtle">{idx.stale ? "delayed" : "as of now"}</span>
                    </span>
                  }
                />
              );
            })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand" /> Top-ranked opportunities
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/suggestions">
                All <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Async
              query={suggestions}
              loading={<div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>}
              empty={(d) => d.suggestions.length === 0}
              emptyTitle="No suggestions yet"
              emptyDescription="The scoring engine needs market data to rank instruments."
            >
              {(data) => (
                <ul className="divide-y divide-line">
                  {data.suggestions.slice(0, 6).map((s) => (
                    <li key={s.symbol} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-md bg-surface-3">
                        <span className="text-sm font-semibold tnum text-ink">{Math.round(s.score)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <SymbolLink symbol={s.symbol} name={s.name} showName />
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{s.reasons[0] ?? s.band}</p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-medium tnum text-ink">{formatCurrency(s.price)}</p>
                        <p className={`text-xs tnum ${trendOf(s.changePercent) === "up" ? "text-up" : trendOf(s.changePercent) === "down" ? "text-down" : "text-muted"}`}>
                          {formatPercent(s.changePercent, { sign: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="hidden capitalize md:inline-flex">
                        {s.band}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Async>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4 text-brand" /> {defaultPortfolio?.name ?? "Portfolio"}
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/portfolio">
                Open <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Async
              query={holdings}
              loading={<Skeleton className="h-40" />}
              empty={() => false}
            >
              {(data) => {
                const t = trendOf(data.totals.unrealizedPnl);
                return (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-subtle">Current value</p>
                      <p className="font-display text-2xl font-semibold tnum text-ink">{formatCurrency(data.totals.currentValue)}</p>
                      <p className={`text-sm tnum ${t === "up" ? "text-up" : t === "down" ? "text-down" : "text-muted"}`}>
                        {formatCurrency(data.totals.unrealizedPnl)} ({formatPercent(data.totals.unrealizedPnlPercent, { sign: true })})
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>Invested</span>
                      <span className="tnum text-ink">{formatCurrency(data.totals.investedValue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>Holdings</span>
                      <span className="tnum text-ink">{data.totals.holdingsCount}</span>
                    </div>
                    {data.totals.incomplete ? (
                      <p className="text-[11px] text-warn">Some prices are unavailable; values may be incomplete.</p>
                    ) : null}
                  </div>
                );
              }}
            </Async>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="size-4 text-brand" /> {primaryWatchlist?.name ?? "Watchlist"}
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/watchlists">
                Manage <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Async
              query={watchlists}
              loading={<Skeleton className="h-32" />}
              empty={(d) => d.length === 0 || (d[0]?.items.length ?? 0) === 0}
              emptyTitle="No watchlist items"
              emptyDescription="Add instruments to a watchlist to track them here."
            >
              {() => (
                <ul className="divide-y divide-line">
                  {primaryWatchlist?.items.slice(0, 6).map((item) => (
                    <li key={item.symbol} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <SymbolLink symbol={item.symbol} name={item.name} showName className="flex-1" />
                      <span className="text-sm font-medium tnum text-ink">{formatCurrency(item.quote?.price)}</span>
                      <ChangePill value={item.quote?.changePercent} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Async>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <Async query={allocation} loading={<Skeleton className="h-52" />} empty={(d) => d.bySector.length === 0} emptyTitle="No holdings">
              {(data) => <AllocationDonut data={data.bySector} height={200} />}
            </Async>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="size-4 text-brand" /> Recently viewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Async
              query={recent}
              loading={<Skeleton className="h-32" />}
              empty={(d) => d.length === 0}
              emptyTitle="Nothing viewed yet"
              emptyDescription="Open a stock to record it here."
            >
              {(items) => (
                <ul className="space-y-2">
                  {items.slice(0, 5).map((item) => (
                    <li key={item.symbol} className="flex items-center gap-3">
                      <SymbolLink symbol={item.symbol} name={item.name} showName className="flex-1" />
                      <span className="text-[11px] text-subtle">{timeAgo(item.viewedAt)}</span>
                      <ChangePill value={item.quote?.changePercent} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Async>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="size-4 text-brand" /> Market news
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/news">
                More <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Async
              query={news}
              loading={<Skeleton className="h-32" />}
              empty={(d) => d.length === 0}
              emptyTitle="No headlines"
            >
              {(items) => (
                <ul className="space-y-3">
                  {items.slice(0, 5).map((item) => (
                    <li key={item.id} className="space-y-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="line-clamp-2 text-sm font-medium text-ink hover:text-brand"
                      >
                        {item.title}
                      </a>
                      <p className="text-[11px] text-subtle">
                        {item.publisher ?? "News"} · {timeAgo(item.publishedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Async>
          </CardContent>
        </Card>
      </div>

      <SectionHeading
        title="Getting started"
        description="A few ways to explore the terminal."
        className="pt-2"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { to: "/screener", icon: Star, title: "Run a screen", body: "Start from a preset like momentum or value." },
          { to: "/paper", icon: Wallet, title: "Paper trade", body: "Practise with a simulated ₹10,00,000 account." },
          { to: "/alerts", icon: Newspaper, title: "Create an alert", body: "Get notified when a price level is crossed." },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong"
          >
            <span className="flex size-10 items-center justify-center rounded-md bg-brand-soft text-brand">
              <item.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink group-hover:text-brand">{item.title}</p>
              <p className="text-xs text-muted">{item.body}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
