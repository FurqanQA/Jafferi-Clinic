import Navbar from "@/components/marketing/navbar/Navbar";
import Hero from "@/components/marketing/hero/Hero";
import TrustedBy from "@/components/marketing/trusted-by/TrustedBy";
import Features from "@/components/marketing/features/Features";
import DashboardPreview from "@/components/marketing/dashboard-preview/DashboardPreview";
import Benefits from "@/components/marketing/benefits/Benefits";
import Stats from "@/components/marketing/stats/Stats";
import HowItWorks from "@/components/marketing/how-it-works/HowItWorks";
import Testimonials from "@/components/marketing/testimonials/Testimonials";
import Pricing from "@/components/marketing/pricing/Pricing";
import FAQ from "@/components/marketing/faq/FAQ";
import CTA from "@/components/marketing/cta/CTA";
import Footer from "@/components/marketing/footer/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <DashboardPreview />
      <Benefits />
      <Stats />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
