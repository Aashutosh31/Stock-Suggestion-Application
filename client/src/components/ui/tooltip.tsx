import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-xs rounded-md border border-line bg-surface-3 px-2.5 py-1.5 text-xs text-ink shadow-[var(--nv-shadow)]",
        "data-[state=delayed-open]:animate-fade-up",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

export function InfoTip({ content, children }: { content: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children ?? (
          <span className="inline-flex size-3.5 cursor-help items-center justify-center rounded-full border border-line-strong text-[9px] text-subtle">
            i
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
