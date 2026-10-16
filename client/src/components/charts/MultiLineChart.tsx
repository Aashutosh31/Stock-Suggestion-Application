import { useEffect, useMemo, useRef } from "react";
import {
  ColorType,
  LineSeries,
  createChart,
  type LineData,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/types";

const PALETTE = ["#7c5cff", "#22d3ee", "#34d399", "#f59e0b", "#f43f5e", "#38bdf8"];

export interface MultiSeries {
  label: string;
  candles: Candle[];
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function MultiLineChart({ series, height = 340 }: { series: MultiSeries[]; height?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const normalized = useMemo(
    () =>
      series.map((s, i) => {
        const first = s.candles.find((c) => c.close)?.close ?? 1;
        const data: LineData[] = s.candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: Number((((c.close - first) / first) * 100).toFixed(2)),
        }));
        return { label: s.label, color: PALETTE[i % PALETTE.length], data };
      }),
    [series],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = createChart(el, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: cssVar("--nv-text-muted", "#909cb4"),
        fontFamily: "Inter, system-ui, sans-serif",
        attributionLogo: false,
      },
      grid: { vertLines: { color: cssVar("--nv-grid", "rgba(255,255,255,0.04)") }, horzLines: { color: cssVar("--nv-grid", "rgba(255,255,255,0.04)") } },
      rightPriceScale: { borderColor: cssVar("--nv-border", "#232c40") },
      timeScale: { borderColor: cssVar("--nv-border", "#232c40"), timeVisible: false },
      localization: { priceFormatter: (p: number) => `${p.toFixed(1)}%` },
    });

    for (const s of normalized) {
      const line = chart.addSeries(LineSeries, { color: s.color, lineWidth: 2, priceLineVisible: false });
      line.setData(s.data);
    }
    chart.timeScale().fitContent();

    const observer = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
    observer.observe(el);
    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [normalized, height]);

  return (
    <div>
      <div ref={ref} style={{ width: "100%", height }} role="img" aria-label="Normalised performance comparison" />
      <div className="mt-2 flex flex-wrap gap-3 px-1">
        {normalized.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="size-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
