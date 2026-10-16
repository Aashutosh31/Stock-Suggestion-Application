import { useEffect, useMemo, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type LineData,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle, IndicatorPoint } from "@/lib/types";

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export interface OverlayOptions {
  sma20?: boolean;
  sma50?: boolean;
  sma200?: boolean;
  bollinger?: boolean;
}

const DEFAULT_OVERLAYS: OverlayOptions = { sma20: true, sma50: false, sma200: false, bollinger: false };

export interface PriceChartProps {
  candles: Candle[];
  indicators?: IndicatorPoint[];
  overlays?: OverlayOptions;
  showVolume?: boolean;
  height?: number;
  className?: string;
}

export function PriceChart({
  candles,
  indicators,
  overlays = DEFAULT_OVERLAYS,
  showVolume = true,
  height = 380,
  className,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const data = useMemo(
    () =>
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    [candles],
  );

  const volume = useMemo(
    () =>
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(52,211,153,0.35)" : "rgba(244,63,94,0.35)",
      })),
    [candles],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const text = cssVar("--nv-text-muted", "#909cb4");
    const grid = cssVar("--nv-grid", "rgba(255,255,255,0.04)");
    const border = cssVar("--nv-border", "#232c40");

    const chart = createChart(el, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: text,
        fontFamily: "Inter, system-ui, sans-serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: grid },
        horzLines: { color: grid },
      },
      rightPriceScale: { borderColor: border, scaleMargins: showVolume ? { top: 0.08, bottom: 0.26 } : { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: border, timeVisible: true, secondsVisible: false, rightOffset: 4 },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: border, labelBackgroundColor: cssVar("--nv-surface-3", "#1b2333") },
        horzLine: { color: border, labelBackgroundColor: cssVar("--nv-surface-3", "#1b2333") },
      },
      localization: {
        locale: "en-IN",
        priceFormatter: (p: number) => p.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
      },
      handleScroll: { vertTouchDrag: false },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f43f5e",
      borderUpColor: "#34d399",
      borderDownColor: "#f43f5e",
      wickUpColor: "#34d399",
      wickDownColor: "#f43f5e",
      priceLineColor: border,
    });
    candleSeries.setData(data);

    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });
      volumeSeries.setData(volume);
    }

    if (indicators && indicators.length) {
      const toLine = (getter: (p: IndicatorPoint) => number | null): LineData<Time>[] =>
        indicators
          .filter((p) => getter(p) !== null)
          .map((p) => ({ time: p.time as UTCTimestamp, value: getter(p) as number }));

      const defs: { key: keyof IndicatorPoint; color: string; width: 1 | 2; enabled: boolean }[] = [
        { key: "sma20", color: "#7c5cff", width: 1, enabled: Boolean(overlays.sma20) },
        { key: "sma50", color: "#38bdf8", width: 1, enabled: Boolean(overlays.sma50) },
        { key: "sma200", color: "#f59e0b", width: 2, enabled: Boolean(overlays.sma200) },
        { key: "bbUpper", color: "rgba(148,163,184,0.55)", width: 1, enabled: Boolean(overlays.bollinger) },
        { key: "bbLower", color: "rgba(148,163,184,0.55)", width: 1, enabled: Boolean(overlays.bollinger) },
      ];
      for (const def of defs) {
        if (!def.enabled) continue;
        const series = chart.addSeries(LineSeries, {
          color: def.color,
          lineWidth: def.width,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        series.setData(toLine((p) => p[def.key] as number | null));
      }
    }

    chart.timeScale().fitContent();

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, volume, indicators, overlays.sma20, overlays.sma50, overlays.sma200, overlays.bollinger, showVolume, height]);

  return <div ref={containerRef} className={className} style={{ width: "100%", height }} role="img" aria-label="Price chart" />;
}
