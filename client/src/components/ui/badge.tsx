import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-line bg-surface-3 text-muted",
        brand: "border-transparent bg-brand-soft text-brand",
        up: "border-transparent bg-up-soft text-up",
        down: "border-transparent bg-down-soft text-down",
        warn: "border-transparent bg-warn-soft text-warn",
        info: "border-transparent bg-info2/15 text-info2",
        outline: "border-line-strong bg-transparent text-muted",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0",
        md: "",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
