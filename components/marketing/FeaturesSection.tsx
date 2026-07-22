import { Activity, CalendarRange, FileText, MessageSquareText, ShieldCheck, Users, Zap, BarChart3 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Smart scheduling",
    description: "AI-powered booking optimization that maximizes availability while reducing no-shows by 40%.",
    icon: CalendarRange,
    span: "md:col-span-2 lg:row-span-2",
    featured: true,
  },
  {
    title: "Patient engagement",
    description: "Automated reminders and follow-up journeys create a premium experience.",
    icon: MessageSquareText,
  },
  {
    title: "Security by design",
    description: "HIPAA-compliant workflows with audit trails and access controls.",
    icon: ShieldCheck,
  },
  {
    title: "Live analytics",
    description: "Real-time dashboards for revenue, appointments, and performance metrics.",
    icon: BarChart3,
    span: "md:col-span-2",
  },
  {
    title: "Team coordination",
    description: "Seamless communication between doctors, nurses, and reception staff.",
    icon: Users,
  },
  {
    title: "Digital records",
    description: "Secure, cloud-based patient records with instant access.",
    icon: FileText,
  },
  {
    title: "Fast workflows",
    description: "Streamlined processes that save hours daily for your team.",
    icon: Zap,
  },
  {
    title: "Revenue insights",
    description: "Executive reporting that brings clarity to financial performance.",
    icon: Activity,
    span: "md:col-span-2",
  },
];

export function FeaturesSection() {
  return (
    <Section className="bg-gradient-to-b from-slate-50/50 to-white">
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Features"
            title="A bento grid for beautifully complex workflows."
            description="Every feature is designed to feel premium, calm, and useful from the first interaction onward."
            className="mx-auto text-center"
          />
        </Reveal>
        <div className="mt-16 grid gap-5 md:grid-cols-4 lg:grid-cols-4 lg:grid-rows-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isFeatured = feature.featured;
            
            return (
              <Reveal key={feature.title} delay={index * 0.06}>
                <Card 
                  className={`h-full border-slate-200/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_20px_60px_-20px_rgba(15,23,42,0.3)] hover:-translate-y-1 ${
                    isFeatured 
                      ? "rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-800 shadow-xl" 
                      : "rounded-[1.75rem]"
                  } ${feature.span ?? ""}`}
                >
                  <CardHeader>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isFeatured 
                        ? "bg-white/10 text-white" 
                        : "bg-slate-900 text-white"
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className={isFeatured ? "text-white text-xl" : ""}>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className={isFeatured ? "text-slate-300 text-base leading-relaxed" : ""}>
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
