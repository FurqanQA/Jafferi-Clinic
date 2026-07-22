import { ReactNode } from "react";
import { MarketingNavbar } from "@/components/navbar/MarketingNavbar";
import { Footer } from "@/components/footer/Footer";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(2,132,199,0.12),_transparent_35%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_45%,_#f8fcff_100%)] text-slate-900">
      <MarketingNavbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
