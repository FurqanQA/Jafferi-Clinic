import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";

export const metadata: Metadata = {
  title: "Privacy Policy | Jafferi Clinic",
  description: "Review the privacy policy for Jafferi Clinic.",
};

export default function PrivacyPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <SectionTitle
          eyebrow="Privacy"
          title="Privacy is part of the experience."
          description="We handle information with care, clarity, and respect for patient and provider trust."
        />
        <div className="mt-8 space-y-4 rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
          <p>This placeholder content outlines the commitment to secure, consent-based handling of clinic and patient information.</p>
          <p>We use reasonable safeguards, clear data practices, and transparent communications to support trustworthy engagement.</p>
        </div>
      </Container>
    </Section>
  );
}
