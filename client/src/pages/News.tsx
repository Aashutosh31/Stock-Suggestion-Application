import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Newspaper, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { DemoBadge } from "@/components/common/badges";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppMeta, useNews, useSearch } from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { timeAgo } from "@/lib/format";

export default function News() {
  const meta = useAppMeta();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [term, setTerm] = useState("");
  const debounced = useDebouncedValue(term, 220);
  const search = useSearch(debounced, 6);
  const news = useNews(symbols.length ? symbols : undefined, 24);

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="News"
        description={
          <span className="flex items-center gap-2">
            Headlines relevant to your watch universe. {meta.data ? <DemoBadge demo={meta.data.provider.demo} /> : null}
          </span>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {symbols.map((s) => (
              <Badge key={s} variant="neutral" className="gap-1.5">
                <Link to={`/stocks/${s}`} className="text-ink hover:text-brand">
                  {s}
                </Link>
                <button className="cursor-pointer" onClick={() => setSymbols((prev) => prev.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                  ×
                </button>
              </Badge>
            ))}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && term.trim()) {
                    setSymbols((prev) => (prev.includes(term.toUpperCase()) ? prev : [...prev, term.toUpperCase()]));
                    setTerm("");
                  }
                }}
                placeholder="Filter by symbol…"
                className="pl-8"
              />
              {term && search.data && search.data.length > 0 ? (
                <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-[var(--nv-shadow)]">
                  {search.data.map((s) => (
                    <li key={s.symbol}>
                      <button
                        className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs hover:bg-surface-2"
                        onClick={() => {
                          setSymbols((prev) => (prev.includes(s.symbol) ? prev : [...prev, s.symbol]));
                          setTerm("");
                        }}
                      >
                        <span className="font-medium text-ink">{s.symbol}</span>
                        <span className="truncate text-[10px] text-subtle">{s.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {symbols.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setSymbols([])}>
                Clear filters
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Async
        query={news}
        loading={
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        }
        empty={(items) => items.length === 0}
        emptyTitle="No headlines"
        emptyDescription="The provider returned no news for this filter."
      >
        {(items) => (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id} className="group">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-subtle">
                    <Newspaper className="size-3.5" />
                    <span>{item.publisher ?? "News"}</span>
                    <span>·</span>
                    <span>{timeAgo(item.publishedAt)}</span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="line-clamp-2 font-medium text-ink group-hover:text-brand"
                  >
                    {item.title}
                  </a>
                  {item.summary ? <p className="mt-2 line-clamp-2 text-xs text-muted">{item.summary}</p> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {item.relatedSymbols.slice(0, 4).map((s) => (
                      <Badge key={s} variant="neutral" size="sm">
                        {s}
                      </Badge>
                    ))}
                    <a href={item.url} target="_blank" rel="noreferrer noopener" className="ml-auto inline-flex items-center gap-1 text-xs text-brand hover:underline">
                      Read <ExternalLink className="size-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Async>
    </div>
  );
}
