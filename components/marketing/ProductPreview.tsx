"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";
import { Calendar, CreditCard, LayoutDashboard, MessageSquare, PieChart, Users, Sparkles } from "lucide-react";

const products = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    description: "Central command for clinic operations",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Patient Portal",
    icon: Users,
    description: "Self-service booking and records",
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Doctor View",
    icon: Calendar,
    description: "Schedule management and patient history",
    color: "from-violet-500 to-purple-500",
  },
  {
    name: "Reception",
    icon: MessageSquare,
    description: "Check-in and communication hub",
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Billing",
    icon: CreditCard,
    description: "Invoicing and payment processing",
    color: "from-pink-500 to-rose-500",
  },
  {
    name: "Analytics",
    icon: PieChart,
    description: "Performance insights and reporting",
    color: "from-indigo-500 to-blue-500",
  },
];

export function ProductPreview() {
  return (
    <Section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(6,182,212,0.15),_transparent_50%)]" />
      <Container className="relative">
        <Reveal>
          <SectionTitle
            eyebrow="Product Showcase"
            title="A complete ecosystem for modern healthcare."
            description="From patient booking to revenue analytics, every screen is designed to feel calm, clear, and premium."
            className="mx-auto text-center"
          />
        </Reveal>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => {
            const Icon = product.icon;
            return (
              <Reveal key={product.name} delay={index * 0.08}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="group relative"
                >
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${product.color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-300`} />
                  <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/10">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${product.color} shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-white">{product.name}</h3>
                    <p className="mt-3 text-slate-400 leading-relaxed">{product.description}</p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-slate-300 group-hover:text-white transition-colors">
                      <span className="font-medium">Learn more</span>
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-20 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-10 backdrop-blur-xl">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Live Demo</span>
                </div>
                <h3 className="text-3xl font-semibold text-white sm:text-4xl">
                  See it in action
                </h3>
                <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                  Experience the full platform with a personalized walkthrough. See how Jafferi Clinic transforms your operations in real-time.
                </p>
              </div>
              <div className="flex items-center justify-center lg:justify-end">
                <div className="flex gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                    <p className="text-4xl font-bold text-white">28</p>
                    <p className="mt-2 text-sm text-slate-400">Active clinics</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                    <p className="text-4xl font-bold text-white">12k+</p>
                    <p className="mt-2 text-sm text-slate-400">Daily users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
