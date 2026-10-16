import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIndices } from "@/hooks/queries";
import { formatNumber, formatPercent, trendOf } from "@/lib/format";

export function TickerTape() {
  const { data, isLoading } = useIndices();

  if (isLoading || !data || data.length === 0) {
    return (
      <div className="h-9.5 border-b border-line bg-bg-elevated">
        <div className="skeleton skeleton-shine h-full w-full" />
      </div>
    );
  }

  return (
    <div className="group border-b border-line bg-bg-elevated">
      <div className="mx-auto flex max-w-[1400px] items-center gap-5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-subtle">Indices</span>
        {data.map((index) => {
          const t = trendOf(index.changePercent);
          return (
            <Link
              key={index.symbol}
              to={`/market#${index.symbol}`}
              className="flex shrink-0 items-center gap-2 text-xs transition-opacity hover:opacity-80"
            >
              <span className="font-medium text-muted">{index.name}</span>
              <span className="tnum font-semibold text-ink">{formatNumber(index.value, 2)}</span>
              <span className={cn("tnum", t === "up" ? "text-up" : t === "down" ? "text-down" : "text-muted")}>
                {formatPercent(index.changePercent, { sign: true })}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
