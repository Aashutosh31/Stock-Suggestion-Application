import { TrendingUp } from "lucide-react";

export function RouteFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-brand text-white shadow-lg">
          <TrendingUp className="size-6" />
        </div>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-3">
          <div className="skeleton skeleton-shine h-full w-full" />
        </div>
      </div>
    </div>
  );
}

export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid place-items-center py-24">
      <div className="flex flex-col items-center gap-3 text-muted">
        <div className="size-6 animate-spin rounded-full border-2 border-line border-t-brand" />
        <p className="text-sm">{label}…</p>
      </div>
    </div>
  );
}
