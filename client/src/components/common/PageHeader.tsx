import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0 space-y-1">
        {breadcrumb ? <div className="mb-1 text-xs text-subtle">{breadcrumb}</div> : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <div className="max-w-2xl text-sm text-muted">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
