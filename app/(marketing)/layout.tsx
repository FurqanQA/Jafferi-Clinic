import { MarketingLayout as Layout } from "@/components/layout/MarketingLayout";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
