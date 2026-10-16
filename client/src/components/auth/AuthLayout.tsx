import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BarChart3, LineChart, ShieldCheck, TrendingUp } from "lucide-react";

const HIGHLIGHTS = [
  { icon: BarChart3, title: "96-instrument universe", body: "Screener with presets, fundamentals and technical filters." },
  { icon: LineChart, title: "Explainable scoring", body: "Every suggestion shows its component scores and reasoning." },
  { icon: ShieldCheck, title: "Private by default", body: "Portfolio, paper trades and notes are scoped to your account." },
];

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-bg-elevated p-10 lg:flex">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
              <TrendingUp className="size-5" />
            </span>
            <span className="font-display text-base font-semibold text-ink">Nivesh Terminal</span>
          </Link>
        </div>
        <div className="relative max-w-lg space-y-6">
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink">
            Research-grade intelligence for Indian equities.
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Screen the NSE/BSE universe, rank opportunities with a transparent scoring model, and track your watchlists,
            portfolio and paper trades — all in one terminal.
          </p>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-3 text-brand">
                  <h.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{h.title}</p>
                  <p className="text-xs text-muted">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-subtle">
          Educational research tool. Not investment advice. No guarantee of returns.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
              <TrendingUp className="size-5" />
            </span>
            <span className="font-display text-base font-semibold text-ink">Nivesh Terminal</span>
          </div>
          <div className="mb-6 space-y-1">
            <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
