import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketStatus } from "@/hooks/queries";
import { formatTime } from "@/lib/format";

const LABEL: Record<string, string> = {
  OPEN: "Market open",
  PRE_OPEN: "Pre-open",
  CLOSED: "Market closed",
  UNAVAILABLE: "Status unavailable",
};

export function MarketStatusPill({ className }: { className?: string }) {
  const { data, isLoading } = useMarketStatus();
  const state = data?.state ?? "UNAVAILABLE";
  const dot =
    state === "OPEN" ? "bg-up" : state === "PRE_OPEN" ? "bg-warn" : state === "CLOSED" ? "bg-subtle" : "bg-down";

  return (
    <div className={cn("flex items-center gap-2 rounded-md border border-line bg-surface-2 px-2.5 py-1.5", className)}>
      <span className="relative flex size-2.5 shrink-0">
        {state === "OPEN" ? <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", dot)} /> : null}
        <span className={cn("relative inline-flex size-2.5 rounded-full", dot)} />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs font-medium text-ink">{isLoading ? "Checking…" : LABEL[state]}</p>
        {data ? (
          <p className="truncate text-[10px] text-subtle">
            {data.demo ? "Demo feed" : "Live feed"} · {formatTime(data.asOf)} IST
          </p>
        ) : null}
      </div>
      <Radio className="ml-auto size-3.5 shrink-0 text-subtle" />
    </div>
  );
}
