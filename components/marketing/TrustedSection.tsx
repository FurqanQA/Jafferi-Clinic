"use client";

import { motion } from "framer-motion";
import { Cloud, Lock, Zap, Cpu, Brain, Building2, ShieldCheck, Globe, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/shared/Reveal";

const trustBadges = [
  { name: "HIPAA Ready", icon: ShieldCheck, description: "Compliant healthcare standards", color: "from-emerald-500 to-teal-600" },
  { name: "Cloud Based", icon: Cloud, description: "99.9% uptime SLA", color: "from-blue-500 to-cyan-600" },
  { name: "24/7 Support", icon: Zap, description: "Round-the-clock assistance", color: "from-amber-500 to-orange-600" },
  { name: "99.9% Uptime", icon: Cpu, description: "Enterprise reliability", color: "from-violet-500 to-purple-600" },
  { name: "Secure Platform", icon: Lock, description: "End-to-end encryption", color: "from-rose-500 to-pink-600" },
  { name: "Multi Clinic", icon: Building2, description: "Scale effortlessly", color: "from-indigo-500 to-blue-600" },
  { name: "Global Access", icon: Globe, description: "Available worldwide", color: "from-cyan-500 to-blue-600" },
  { name: "SOC 2 Compliant", icon: CheckCircle2, description: "Security certified", color: "from-slate-600 to-slate-800" },
];

export function TrustedSection() {
  return (
    <Section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-slate-50 py-24">
      {/* Ambient background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[80px]" />
      </div>

      <Container className="flex flex-col items-center gap-16">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-600 mb-4">Enterprise-grade infrastructure</p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Built for trust, designed for scale
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Every aspect of our platform is engineered to meet the highest standards of healthcare security and reliability.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-6xl">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <Reveal key={badge.name} delay={index * 0.08}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative"
                >
                  {/* Glass effect background */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${badge.color} opacity-0 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
                  
                  {/* Card */}
                  <div className="relative rounded-3xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-lg shadow-slate-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-slate-300/50 group-hover:border-slate-300">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${badge.color} text-white shadow-lg`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-900">{badge.name}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{badge.description}</p>
                    
                    {/* Hover indicator */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600"
                    >
                      <span>Learn more</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        {/* Stats bar */}
        <Reveal delay={0.6}>
          <div className="mt-8 rounded-3xl border border-slate-200/60 bg-white/90 p-8 backdrop-blur-xl shadow-xl shadow-slate-200/50">
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-5xl font-bold text-slate-900 tracking-tight">99.99%</p>
                <p className="mt-2 text-sm font-medium text-slate-600">Platform Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-slate-900 tracking-tight">&lt;50ms</p>
                <p className="mt-2 text-sm font-medium text-slate-600">Response Time</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-slate-900 tracking-tight">256-bit</p>
                <p className="mt-2 text-sm font-medium text-slate-600">Encryption</p>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
