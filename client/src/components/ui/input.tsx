import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-9.5 w-full rounded-md border border-line bg-surface-2 px-3 py-1 text-sm text-ink transition-colors",
        "placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand",
        "disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
