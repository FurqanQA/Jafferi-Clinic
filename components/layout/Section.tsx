import * as React from "react";
import { cn } from "@/lib/utils";

export function Section({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <section className={cn("py-20 sm:py-24 lg:py-28", className)}>{children}</section>;
}
