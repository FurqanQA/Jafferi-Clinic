import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing | Jafferi Clinic",
  description: "See the flexible pricing options designed for modern clinics and growing care teams.",
};

const plans = [
  { name: "Starter", price: "$49", description: "For small practices getting started with premium scheduling." },
  { name: "Growth", price: "$129", description: "For teams that want stronger coordination and patient engagement." },
  { name: "Scale", price: "Custom", description: "For multi-site clinics that need deeper flexibility and support." },
];

export default function PricingPage() {
  return (
    <Section>
      <Container>
        <SectionTitle
          eyebrow="Pricing"
          title="Flexible plans that match your clinic’s growth."
          description="Every package is designed to feel straightforward, reliable, and easy to adopt."
          className="max-w-3xl"
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className="rounded-[1.75rem]">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-4xl font-semibold text-slate-900">{plan.price}</p>
              </CardHeader>
              <CardContent>
                <CardDescription>{plan.description}</CardDescription>
                <Button className="mt-6 rounded-full bg-slate-900 text-white">Get started</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
