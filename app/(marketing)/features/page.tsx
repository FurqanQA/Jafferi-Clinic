import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Features | Jafferi Clinic",
  description: "Explore the capabilities that make Jafferi Clinic a premium experience for modern clinics.",
};

const featureList = [
  { title: "Smart booking", description: "Guide patients through a polished scheduling journey that reduces friction and no-shows." },
  { title: "Care coordination", description: "Keep every visit, reminder, and handoff aligned in one place." },
  { title: "Live visibility", description: "Monitor operations with simple reporting that keeps daily teams informed." },
];

export default function FeaturesPage() {
  return (
    <Section>
      <Container>
        <SectionTitle
          eyebrow="Features"
          title="A thoughtful platform for better care operations."
          description="Every capability is designed to feel clear, modern, and supportive for high-performing teams."
          className="max-w-3xl"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featureList.map((feature) => (
            <Card key={feature.title} className="rounded-[1.75rem]">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
