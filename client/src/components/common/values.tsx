import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatSigned, trendOf } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function ChangePill({
  value,
  className,
  size = "md",
}: {
  value: number | null | undefined;
  className?: string;
  size?: "sm" | "md";
}) {
  const t = trendOf(value);
  const Icon = t === "up" ? ArrowUpRight : t === "down" ? ArrowDownRight : Minus;
  const variant = t === "up" ? "up" : t === "down" ? "down" : "neutral";
  return (
    <Badge variant={variant} size={size === "sm" ? "sm" : "md"} className={cn("tnum", className)}>
      <Icon className="size-3" />
      {formatPercent(value, { sign: true })}
    </Badge>
  );
}

export function PriceCell({
  price,
  changePercent,
  currency = true,
  className,
}: {
  price: number | null | undefined;
  changePercent?: number | null;
  currency?: boolean;
  className?: string;
}) {
  const t = trendOf(changePercent);
  const colorClass = t === "up" ? "text-up" : t === "down" ? "text-down" : "text-ink";
  return (
    <div className={cn("flex flex-col items-end gap-0.5", className)}>
      <span className={cn("text-sm font-semibold tnum", currency ? "text-ink" : colorClass)}>
        {currency ? formatCurrency(price) : formatSigned(price)}
      </span>
      {changePercent !== undefined ? (
        <span className={cn("text-xs tnum", t === "up" ? "text-up" : t === "down" ? "text-down" : "text-muted")}>
          {formatPercent(changePercent, { sign: true })}
        </span>
      ) : null}
    </div>
  );
}

export function SymbolLink({
  symbol,
  name,
  className,
  showName = false,
}: {
  symbol: string;
  name?: string | null;
  className?: string;
  showName?: boolean;
}) {
  return (
    <Link
      to={`/stocks/${symbol}`}
      className={cn("group flex min-w-0 flex-col leading-tight", className)}
    >
      <span className="truncate text-sm font-semibold text-ink group-hover:text-brand">{symbol}</span>
      {showName && name ? <span className="truncate text-xs text-subtle">{name}</span> : null}
    </Link>
  );
}
