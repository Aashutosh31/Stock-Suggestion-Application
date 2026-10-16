import type { MarketState } from "./types.js";

export const MARKET_TIMEZONE = "Asia/Kolkata";

/** Public holidays 2024–2026 for NSE (best-effort static list). Update as needed. */
const NSE_HOLIDAYS = new Set([
  // 2024
  "2024-01-26", "2024-03-08", "2024-03-25", "2024-03-29", "2024-04-11", "2024-04-17",
  "2024-05-01", "2024-05-20", "2024-06-17", "2024-07-17", "2024-08-15", "2024-10-02",
  "2024-11-01", "2024-11-15", "2024-12-25",
  // 2025
  "2025-02-26", "2025-03-14", "2025-03-31", "2025-04-10", "2025-04-14", "2025-04-18",
  "2025-05-01", "2025-08-15", "2025-08-27", "2025-10-02", "2025-10-21", "2025-10-22",
  "2025-11-05", "2025-12-25",
  // 2026
  "2026-01-26", "2026-03-04", "2026-03-26", "2026-04-01", "2026-04-03", "2026-05-01",
  "2026-08-15", "2026-10-02", "2026-12-25",
]);

// A single cached formatter — constructing Intl.DateTimeFormat is expensive and
// istParts() is called once per calendar day when building demo series.
const IST_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: MARKET_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  weekday: "short",
});

/** Returns YYYY-MM-DD and minutes-since-midnight in the IST timezone. */
function istParts(date: Date): { dateKey: string; weekday: number; minutes: number } {
  const parts = IST_FORMATTER.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour") === "24" ? "00" : get("hour");
  const minute = get("minute");
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    dateKey: `${year}-${month}-${day}`,
    weekday: weekdayMap[get("weekday")] ?? 1,
    minutes: Number(hour) * 60 + Number(minute),
  };
}

export function isTradingDay(date: Date): boolean {
  const { weekday, dateKey } = istParts(date);
  if (weekday === 0 || weekday === 6) return false;
  return !NSE_HOLIDAYS.has(dateKey);
}

const OPEN = 9 * 60 + 15; // 09:15 IST
const CLOSE = 15 * 60 + 30; // 15:30 IST
const PRE_OPEN = 9 * 60; // 09:00 IST

export function getMarketState(now: Date = new Date()): MarketState {
  const { minutes, weekday } = istParts(now);
  if (weekday === 0 || weekday === 6) return "CLOSED";
  if (!isTradingDay(now)) return "CLOSED";
  if (minutes >= PRE_OPEN && minutes < OPEN) return "PRE_OPEN";
  if (minutes >= OPEN && minutes <= CLOSE) return "OPEN";
  return "CLOSED";
}

/**
 * Next session open (09:15 IST) as a UTC Date. Walks forward up to two weeks so
 * weekends and listed holidays are skipped.
 */
export function nextMarketOpen(now: Date = new Date()): Date {
  for (let offset = 0; offset < 14; offset++) {
    const probe = new Date(now.getTime() + offset * 86_400_000);
    const { dateKey } = istParts(probe);
    const [y, m, d] = dateKey.split("-").map(Number);
    // 09:15 IST == 03:45 UTC
    const openUtc = new Date(Date.UTC(y!, m! - 1, d!, 3, 45, 0, 0));
    if (!isTradingDay(openUtc)) continue;
    if (openUtc.getTime() > now.getTime()) return openUtc;
  }
  return new Date(now.getTime() + 86_400_000);
}
