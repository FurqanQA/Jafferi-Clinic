import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { TrustedSection } from "@/components/marketing/TrustedSection";
import { WhyChooseUs } from "@/components/marketing/WhyChooseUs";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Departments } from "@/components/marketing/Departments";
import { Doctors } from "@/components/marketing/Doctors";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FAQ } from "@/components/marketing/FAQ";
import { CTA } from "@/components/marketing/CTA";

export const metadata: Metadata = {
  title: "Jafferi Clinic | Modern healthcare operations",
  description: "Premium marketing website for Jafferi Clinic, showcasing patient-first care delivery and modern clinic operations.",
};

export default function MarketingHomePage() {
  return (
    <>
      <Hero />
      <TrustedSection />
      <WhyChooseUs />
      <FeaturesSection />
      <HowItWorks />
      <Departments />
      <Doctors />
      <ProductPreview />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}
