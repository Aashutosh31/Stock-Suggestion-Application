import { Clock, FlaskConical, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/format";

export function DemoBadge({ demo, className }: { demo: boolean; className?: string }) {
  if (!demo) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="warn" className={cn("cursor-help", className)}>
          <FlaskConical className="size-3" />
          Demo data
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Prices and fundamentals are deterministically simulated for demonstration. They are clearly not live market data.
      </TooltipContent>
    </Tooltip>
  );
}

export function StaleBadge({ stale, timestamp, className }: { stale: boolean; timestamp?: string; className?: string }) {
  if (!stale) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="warn" className={cn("cursor-help", className)}>
          <Clock className="size-3" />
          Delayed
        </Badge>
      </TooltipTrigger>
      <TooltipContent>Last updated {timestamp ? formatDateTime(timestamp) : "unknown"}.</TooltipContent>
    </Tooltip>
  );
}

export function DisclaimerNote({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-md border border-warn/25 bg-warn-soft/40 px-3 py-2 text-xs text-warn", className)}>
      <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}
