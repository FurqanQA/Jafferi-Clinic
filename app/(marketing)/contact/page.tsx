import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact | Jafferi Clinic",
  description: "Get in touch with Jafferi Clinic to book a demo or explore the platform.",
};

export default function ContactPage() {
  return (
    <Section>
      <Container className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionTitle
            eyebrow="Contact"
            title="Let’s build a better patient experience together."
            description="Share a few details and our team will reach out to guide you through the next step."
            className="max-w-2xl"
          />
        </div>
        <Card className="rounded-[2rem]">
          <CardContent className="space-y-4 py-2">
            <Input placeholder="Your name" />
            <Input placeholder="Work email" type="email" />
            <Input placeholder="Clinic name" />
            <textarea className="min-h-32 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" placeholder="Tell us about your clinic" />
            <Button className="rounded-full bg-slate-900 text-white">Request demo</Button>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
