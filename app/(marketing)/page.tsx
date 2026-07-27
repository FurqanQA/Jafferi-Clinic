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
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jafferi Clinic - AI-Powered Clinic Management Software",
  description: "Modern clinic management software that helps healthcare providers manage appointments, patients, billing, doctors, reports, and analytics from one dashboard. Streamline your clinic operations today.",
  keywords: "clinic management software, medical practice management, healthcare software, appointment scheduling, patient records, clinic automation, medical billing",
  authors: [{ name: "Jafferi Clinic" }],
  creator: "Jafferi Clinic",
  publisher: "Jafferi Clinic",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jaffericlinic.com",
    title: "Jafferi Clinic - AI-Powered Clinic Management Software",
    description: "Modern clinic management software that helps healthcare providers manage appointments, patients, billing, doctors, reports, and analytics from one dashboard.",
    siteName: "Jafferi Clinic",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jafferi Clinic Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jafferi Clinic - AI-Powered Clinic Management Software",
    description: "Modern clinic management software that helps healthcare providers manage appointments, patients, billing, doctors, reports, and analytics from one dashboard.",
    images: ["/images/og-image.png"],
    creator: "@jaffericlinic",
  },
  alternates: {
    canonical: "https://jaffericlinic.com",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function MarketingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Jafferi Clinic",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free trial available",
    },
    description: "Modern clinic management software that helps healthcare providers manage appointments, patients, billing, doctors, reports, and analytics from one dashboard.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
    creator: {
      "@type": "Organization",
      name: "Jafferi Clinic",
      url: "https://jaffericlinic.com",
      logo: "https://jaffericlinic.com/images/Jafferi Clinic.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+92 300 1234567",
        contactType: "customer service",
        email: "hello@jaffericlinic.com",
        areaServed: "PK",
        availableLanguage: "English",
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "Pakistan",
        addressLocality: "Karachi",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
    </>
  );
}