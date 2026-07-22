import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
        variant === "secondary" && "border-transparent bg-sky-100 text-sky-700",
        variant === "outline" && "border-slate-200 bg-white text-slate-700",
        variant === "default" && "border-transparent bg-slate-900 text-white",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };