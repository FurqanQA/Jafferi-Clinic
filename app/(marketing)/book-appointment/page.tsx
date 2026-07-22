import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Book Appointment | Jafferi Clinic",
  description: "Schedule a consultation for Jafferi Clinic and experience the care journey first hand.",
};

export default function BookAppointmentPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <SectionTitle
          eyebrow="Book appointment"
          title="Reserve a guided introduction to Jafferi Clinic."
          description="We’ll walk you through how the experience can support your team and your patients."
        />
        <Card className="mt-10 rounded-[2rem]">
          <CardContent className="space-y-4 py-2">
            <Input placeholder="Full name" />
            <Input placeholder="Email address" type="email" />
            <Input placeholder="Preferred date" />
            <textarea className="min-h-32 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" placeholder="Tell us what you’d like to explore" />
            <Button className="rounded-full bg-slate-900 text-white">Submit request</Button>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
