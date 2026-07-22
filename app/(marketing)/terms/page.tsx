import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";

export const metadata: Metadata = {
  title: "Terms of Service | Jafferi Clinic",
  description: "Review the terms of service for Jafferi Clinic.",
};

export default function TermsPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <SectionTitle
          eyebrow="Terms"
          title="Terms of service for the Jafferi Clinic experience."
          description="These terms define the responsibilities and expectations for using the website and related materials."
        />
        <div className="mt-8 space-y-4 rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
          <p>Use of this website is intended for informational and prospective engagement purposes.</p>
          <p>Any scheduling or service-related requests should be handled directly through the clinic or designated partner channels.</p>
        </div>
      </Container>
    </Section>
  );
}
