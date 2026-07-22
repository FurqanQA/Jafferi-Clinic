import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";

export const metadata: Metadata = {
  title: "About Jafferi Clinic",
  description: "Learn more about Jafferi Clinic and the team behind the modern care experience.",
};

export default function AboutPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <SectionTitle
          eyebrow="About"
          title="A modern clinic experience rooted in thoughtful care."
          description="Jafferi Clinic was designed to help healthcare teams offer a calm, premium experience from the first booking to the last follow-up."
        />
        <div className="mt-8 space-y-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-slate-700">
          <p>We believe every healthcare interaction should feel respectful, clear, and easy to navigate.</p>
          <p>Our platform combines elegant design, reliable operations, and patient-first communication into a single experience that supports modern clinics.</p>
        </div>
      </Container>
    </Section>
  );
}
