"use client";

import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ShieldCheck, Sparkles, Award, Clock, TrendingUp } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const points = [
  {
    title: "Luxury experience",
    description: "Every interaction feels elevated, intuitive, and clear for patients and teams.",
    icon: Sparkles,
    stat: "4.9/5",
    statLabel: "User rating",
  },
  {
    title: "Built for trust",
    description: "Secure workflows and audit-friendly operations support modern healthcare standards.",
    icon: ShieldCheck,
    stat: "100%",
    statLabel: "HIPAA compliant",
  },
  {
    title: "Operational clarity",
    description: "Coordinate appointments, billing, and care touchpoints in a single premium workspace.",
    icon: BrainCircuit,
    stat: "40%",
    statLabel: "Time saved",
  },
  {
    title: "Award-winning design",
    description: "Recognized for excellence in healthcare UX and interface design.",
    icon: Award,
    stat: "12+",
    statLabel: "Design awards",
  },
  {
    title: "Lightning fast",
    description: "Optimized performance ensures your team never waits for the system.",
    icon: Clock,
    stat: "<1s",
    statLabel: "Response time",
  },
  {
    title: "Growth focused",
    description: "Scale from single clinic to multi-location operations seamlessly.",
    icon: TrendingUp,
    stat: "3x",
    statLabel: "Faster growth",
  },
];

export function WhyChooseUs() {
  return (
    <Section className="bg-gradient-to-b from-white to-slate-50/50">
      <Container>
        <div className="grid items-start gap-16 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <SectionTitle
              eyebrow="Why Jafferi"
              title="A premium healthcare operating system for ambitious clinics."
              description="The experience is engineered to feel modern, calm, and unmistakably high-end—because your patients deserve nothing less."
            />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {points.map((point, index) => {
              const Icon = point.icon;
              return (
                <Reveal key={point.title} delay={index * 0.06}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full rounded-[1.75rem] border-slate-200/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_24px_70px_-24px_rgba(15,23,42,0.25)] hover:border-slate-300">
                      <CardHeader>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg">
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">{point.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="leading-relaxed">{point.description}</CardDescription>
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-2xl font-bold text-slate-900">{point.stat}</span>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">{point.statLabel}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
        <Reveal>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="mt-16 rounded-[2.5rem] border border-slate-200/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 text-white shadow-[0_40px_120px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl"
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
                    <Sparkles className="h-5 w-5 text-cyan-400" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">Operational excellence</p>
                </div>
                <h3 className="text-3xl font-semibold sm:text-4xl leading-tight">
                  From the first booking to the final follow-up, every touchpoint stays beautifully coordinated.
                </h3>
              </div>
              <motion.a
                href="/features"
                whileHover={{ x: 4 }}
                className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/30"
              >
                Explore platform <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>
          </motion.div>
        </Reveal>
      </Container>
    </Section>
  );
}
