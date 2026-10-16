import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

const inr = (opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", ...opts });

export function formatCurrency(value: number | null | undefined, opts: { compact?: boolean; decimals?: number } = {}): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (opts.compact) return inr({ notation: "compact", maximumFractionDigits: 2 }).format(value);
  return inr({
    minimumFractionDigits: opts.decimals ?? 2,
    maximumFractionDigits: opts.decimals ?? 2,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

export function formatPercent(value: number | null | undefined, opts: { sign?: boolean; decimals?: number } = {}): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const sign = opts.sign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(opts.decimals ?? 2)}%`;
}

export function formatSigned(value: number | null | undefined, opts: { decimals?: number } = {}): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${new Intl.NumberFormat("en-IN", { minimumFractionDigits: opts.decimals ?? 2, maximumFractionDigits: opts.decimals ?? 2 }).format(Math.abs(value))}`;
}

export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
  return String(Math.round(value));
}

export function formatMarketCap(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `₹${formatCompactNumber(value)}`;
}

export type Trend = "up" | "down" | "flat";

export function trendOf(value: number | null | undefined): Trend {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

export function trendTextClass(value: number | null | undefined): string {
  const t = trendOf(value);
  if (t === "up") return "text-up";
  if (t === "down") return "text-down";
  return "text-muted";
}

export function trendBgClass(value: number | null | undefined): string {
  const t = trendOf(value);
  if (t === "up") return "bg-up-soft text-up";
  if (t === "down") return "bg-down-soft text-down";
  return "bg-surface-3 text-muted";
}

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Date ? value : typeof value === "number" ? new Date(value) : parseISO(value);
  return isValid(d) ? d : null;
}

export function formatDate(value: string | number | Date | null | undefined, pattern = "dd MMM yyyy"): string {
  const d = toDate(value);
  return d ? format(d, pattern) : "—";
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "dd MMM yyyy, HH:mm") : "—";
}

export function formatTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "HH:mm") : "—";
}

export function timeAgo(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return `${formatDistanceToNowStrict(d)} ago`;
}

export function scoreBandClass(score: number): string {
  if (score >= 72) return "text-up";
  if (score >= 58) return "text-accent2";
  if (score >= 42) return "text-warn";
  return "text-down";
}
