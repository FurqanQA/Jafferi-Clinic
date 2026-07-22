import { Badge as BadgePrimitive } from "@/components/ui/badge";

export function MarketingBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <BadgePrimitive variant="secondary" className={className}>
      {children}
    </BadgePrimitive>
  );
}
