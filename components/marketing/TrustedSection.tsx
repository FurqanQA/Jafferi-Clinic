"use client";

import { motion } from "framer-motion";
import { Cloud, Lock, Zap, Cpu, Brain, Building2 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/shared/Reveal";

const trustBadges = [
  { name: "Cloud Ready", icon: Cloud, description: "99.9% uptime SLA" },
  { name: "Secure", icon: Lock, description: "End-to-end encryption" },
  { name: "Fast", icon: Zap, description: "Sub-second response" },
  { name: "Modern", icon: Cpu, description: "Latest technology stack" },
  { name: "AI Powered", icon: Brain, description: "Intelligent automation" },
  { name: "Multi Clinic", icon: Building2, description: "Scale effortlessly" },
];

export function TrustedSection() {
  return (
    <Section className="border-y border-slate-200/60 bg-gradient-to-r from-white via-slate-50/50 to-white py-16">
      <Container className="flex flex-col items-center gap-10">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">Premium trust infrastructure</p>
        </Reveal>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <Reveal key={badge.name} delay={index * 0.06}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-slate-300"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white group-hover:bg-slate-800 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{badge.name}</p>
                    <p className="text-xs text-slate-500">{badge.description}</p>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
