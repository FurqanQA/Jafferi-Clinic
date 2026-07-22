import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="py-20">
      <Container className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-6 w-full max-w-2xl" />
        <Skeleton className="h-6 w-full max-w-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Container>
    </div>
  );
}
