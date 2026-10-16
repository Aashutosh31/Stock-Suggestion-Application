import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Info, Settings2, SlidersHorizontal, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { DisclaimerNote, DemoBadge, StaleBadge } from "@/components/common/badges";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/ui/feedback";
import { Progress } from "@/components/ui/primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InfoTip } from "@/components/ui/tooltip";
import { ScoreRadar, ComponentBars } from "@/components/charts/ScoreCharts";
import { useAppMeta, useCustomSuggestions, useDefaultWeights, useSuggestions } from "@/hooks/queries";
import type { Suggestion } from "@/lib/types";
import { formatCurrency, formatPercent, scoreBandClass, timeAgo, trendOf } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEIGHT_LABELS: Record<string, string> = {
  momentum: "Price momentum",
  technical: "Technical strength",
  valuation: "Valuation",
  quality: "Financial quality",
  growth: "Growth",
  liquidity: "Liquidity",
  risk: "Risk & drawdown",
  relative: "Relative performance",
};

function SuggestionCard({ suggestion, onOpen }: { suggestion: Suggestion; onOpen: () => void }) {
  const t = trendOf(suggestion.changePercent);
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex w-14 shrink-0 flex-col items-center">
            <span className={cn("font-display text-2xl font-semibold tnum", scoreBandClass(suggestion.score))}>
              {Math.round(suggestion.score)}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-subtle">score</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/stocks/${suggestion.symbol}`} className="text-sm font-semibold text-ink hover:text-brand">
                {suggestion.symbol}
              </Link>
              <span className="truncate text-xs text-subtle">{suggestion.name}</span>
              <Badge variant="outline" className="capitalize">{suggestion.band}</Badge>
              {suggestion.sector ? <Badge variant="neutral">{suggestion.sector}</Badge> : null}
              <StaleBadge stale={suggestion.stale} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-sm font-medium tnum text-ink">{formatCurrency(suggestion.price)}</span>
              <span className={t === "up" ? "tnum text-up" : t === "down" ? "tnum text-down" : "tnum text-muted"}>
                {formatPercent(suggestion.changePercent, { sign: true })}
              </span>
              <span className="text-subtle">Data completeness {suggestion.dataCompleteness}%</span>
            </div>

            {suggestion.reasons.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {suggestion.reasons.slice(0, 2).map((reason) => (
                  <li key={reason} className="flex items-start gap-1.5 text-xs text-muted">
                    <TrendingUp className="mt-0.5 size-3 shrink-0 text-up" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {suggestion.concerns.length > 0 ? (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-warn">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                <span>{suggestion.concerns[0]}</span>
              </p>
            ) : null}

            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onOpen}>
                <Info className="size-3.5" /> Why this score
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/stocks/${suggestion.symbol}`}>Open</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Suggestions() {
  const meta = useAppMeta();
  const [sector, setSector] = useState("");
  const [exchange, setExchange] = useState("");
  const [trend, setTrend] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [limit, setLimit] = useState(15);
  const [includeStale, setIncludeStale] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);

  const aiEnabled = meta.data?.capabilities.aiExplain ?? false;
  const [ai, setAi] = useState(false);

  const query = useSuggestions({ limit, minScore, sector: sector || undefined, exchange: exchange || undefined, trend: trend || undefined, includeStale, ai });

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Suggestions"
        description={
          <span className="flex items-center gap-2">
            Deterministic, explainable rankings. Every score is decomposed into weighted components you can inspect.
            {meta.data ? <DemoBadge demo={meta.data.provider.demo} /> : null}
          </span>
        }
        actions={<WeightCustomizerDialog defaultLimit={limit} />}
      />

      <DisclaimerNote text="These rankings are analytical outputs from the listed metrics. They are educational research, not buy/sell recommendations, and carry no guarantee of returns." />

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Sector</span>
            <Select value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">All sectors</option>
              {(meta.data?.filters.sectors ?? []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Exchange</span>
            <Select value={exchange} onChange={(e) => setExchange(e.target.value)}>
              <option value="">Any exchange</option>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Trend</span>
            <Select value={trend} onChange={(e) => setTrend(e.target.value)}>
              <option value="">Any trend</option>
              <option value="up">Uptrend</option>
              <option value="sideways">Sideways</option>
              <option value="down">Downtrend</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-muted">
              <SlidersHorizontal className="size-3" /> Min score
            </span>
            <Input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value) || 0)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Results</span>
            <Select value={String(limit)} onChange={(e) => setLimit(Number(e.target.value))}>
              {[10, 15, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  Top {n}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-5">
            <label className="flex items-center gap-2 text-xs text-muted">
              <Switch checked={includeStale} onCheckedChange={setIncludeStale} /> Include delayed-data instruments
            </label>
            <label className={cn("flex items-center gap-2 text-xs", aiEnabled ? "text-muted" : "text-subtle opacity-60")}>
              <Switch checked={ai && aiEnabled} onCheckedChange={setAi} disabled={!aiEnabled} /> AI narrative
              <InfoTip content={aiEnabled ? "Adds a plain-language summary. Requires an AI key on the server." : "Enable AI_EXPLAIN_ENABLED and set GROQ_API_KEY on the server to use this."} />
            </label>
          </div>
        </CardContent>
      </Card>

      <Async
        query={query}
        loading={
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        }
        empty={(d) => d.suggestions.length === 0}
        emptyTitle="No instruments met your filters"
        emptyDescription="Relax the minimum score or widen the sector filters."
      >
        {(data) => (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>
                {data.suggestions.length} ranked of {data.universeSize} instruments · benchmark 1y{" "}
                <span className={data.benchmarkReturn1y != null && data.benchmarkReturn1y >= 0 ? "text-up" : "text-down"}>
                  {formatPercent(data.benchmarkReturn1y, { sign: true })}
                </span>
              </span>
              <span>Generated {timeAgo(data.generatedAt)}</span>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {data.suggestions.map((s) => (
                <SuggestionCard key={s.symbol} suggestion={s} onOpen={() => setSelected(s)} />
              ))}
            </div>
          </>
        )}
      </Async>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.symbol}
                  <Badge variant="outline" className="capitalize">{selected.band}</Badge>
                  <span className={cn("ml-auto font-display text-xl tnum", scoreBandClass(selected.score))}>{Math.round(selected.score)}</span>
                </DialogTitle>
                <DialogDescription>
                  {selected.name} · weighted components (scores are 0–100; unavailable metrics are excluded and weights renormalised).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <ScoreRadar components={selected.components} />
                <div className="space-y-2">
                  {selected.components.map((c) => (
                    <div key={c.key}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">{c.label}</span>
                        <span className="tnum text-ink">{c.score === null ? "n/a" : Math.round(c.score)}</span>
                      </div>
                      <Progress
                        value={c.score ?? 0}
                        indicatorClassName={c.score === null ? "bg-line-strong" : undefined}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <ComponentBars components={selected.components} />
              {selected.reasons.length > 0 ? (
                <div>
                  <SectionHeading title="Supporting factors" className="mb-2" />
                  <ul className="space-y-1.5">
                    {selected.reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-muted">
                        <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-up" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {selected.concerns.length > 0 ? (
                <div>
                  <SectionHeading title="Concerns" className="mb-2" />
                  <ul className="space-y-1.5">
                    {selected.concerns.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm text-warn">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <SectionHeading title="What would invalidate this view" className="mb-2" />
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                  {selected.invalidation.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
              {selected.aiNarrative ? (
                <div className="rounded-md border border-line bg-surface-2 p-3 text-sm text-muted">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink">
                    <Sparkles className="size-3.5 text-brand" /> AI narrative
                  </p>
                  {selected.aiNarrative}
                </div>
              ) : null}
              <DialogFooter>
                <Button asChild variant="outline">
                  <Link to={`/stocks/${selected.symbol}`}>Open full profile</Link>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WeightCustomizerDialog({ defaultLimit }: { defaultLimit: number }) {
  const defaults = useDefaultWeights();
  const custom = useCustomSuggestions();
  const [open, setOpen] = useState(false);
  const [weights, setWeights] = useState<Record<string, number> | null>(null);
  const [results, setResults] = useState<Suggestion[] | null>(null);

  const active = weights ?? defaults.data ?? null;
  const sum = useMemo(() => (active ? Object.values(active).reduce((a, b) => a + b, 0) : 0), [active]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && !weights && defaults.data) setWeights(defaults.data);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 /> Custom weights
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-brand" /> Custom scoring weights
          </DialogTitle>
          <DialogDescription>
            Adjust the relative importance of each component. Weights are normalised to sum to 1 before scoring.
          </DialogDescription>
        </DialogHeader>

        {!active ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {Object.keys(active).map((key) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">{WEIGHT_LABELS[key] ?? key}</span>
                    <span className="tnum text-ink">{((active[key] ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={active[key] ?? 0}
                    onChange={(e) => setWeights({ ...active, [key]: Number(e.target.value) })}
                    className="mt-1 w-full accent-[var(--nv-brand)]"
                  />
                </div>
              ))}
              <p className="text-[11px] text-subtle">Current sum: {(sum * 100).toFixed(0)}% (auto-normalised)</p>
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Preview</p>
                <Button
                  size="sm"
                  loading={custom.isPending}
                  onClick={() => custom.mutate({ limit: defaultLimit, weights: active, ai: false }, { onSuccess: (d) => setResults(d.suggestions) })}
                >
                  Run
                </Button>
              </div>
              {results ? (
                <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {results.map((s) => (
                    <li key={s.symbol} className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3 py-2 text-sm">
                      <span className="font-medium text-ink">{s.symbol}</span>
                      <span className={cn("tnum font-semibold", scoreBandClass(s.score))}>{Math.round(s.score)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid h-64 place-items-center rounded-lg border border-dashed border-line text-center text-xs text-subtle">
                  Run the model to preview rankings with your weights.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => defaults.data && setWeights(defaults.data)}>
            Reset to defaults
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
