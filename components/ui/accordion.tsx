import * as React from "react";
import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full space-y-3", className)} {...props} />;
}

function AccordionItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm", className)} {...props} />;
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("flex w-full items-center justify-between px-6 py-5 text-left text-sm font-semibold text-slate-900", className)}
      {...props}
    >
      {children}
    </button>
  );
}

function AccordionContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-slate-200 px-6 pb-6 pt-2 text-sm leading-7 text-slate-600", className)} {...props} />;
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };