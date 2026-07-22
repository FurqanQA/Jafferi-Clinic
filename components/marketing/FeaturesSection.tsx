"use client";

import { motion } from "framer-motion";
import { Activity, CalendarRange, FileText, MessageSquareText, ShieldCheck, Users, Zap, BarChart3, CreditCard, Bell, Settings, LayoutDashboard } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";

const features = [
  {
    title: "Smart Scheduling",
    description: "AI-powered booking optimization that maximizes availability while reducing no-shows by 40%.",
    icon: CalendarRange,
    color: "from-blue-500 to-cyan-500",
    span: "md:col-span-2",
    featured: true,
  },
  {
    title: "Patient Portal",
    description: "Self-service booking and records access for patients.",
    icon: Users,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "E-Prescribing",
    description: "Secure electronic prescriptions with pharmacy integration.",
    icon: FileText,
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "Medical Records",
    description: "Comprehensive EMR with instant access and audit trails.",
    icon: ShieldCheck,
    color: "from-rose-500 to-pink-500",
  },
  {
    title: "Billing & Payments",
    description: "Integrated invoicing with insurance processing.",
    icon: CreditCard,
    color: "from-amber-500 to-orange-500",
    span: "md:col-span-2",
  },
  {
    title: "Analytics Dashboard",
    description: "Real-time insights for revenue and performance.",
    icon: BarChart3,
    color: "from-indigo-500 to-blue-500",
  },
  {
    title: "Communication",
    description: "Automated reminders and secure messaging.",
    icon: Bell,
    color: "from-cyan-500 to-blue-500",
  },
  {
    title: "Workflow Automation",
    description: "Streamlined processes that save hours daily.",
    icon: Zap,
    color: "from-yellow-500 to-amber-500",
  },
];

export function FeaturesSection() {
  return (
    <Section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/30 py-32">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 right-1/4 w-[700px] h-[700px] bg-blue-400/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[100px]" />
      </div>

      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Features"
            title="Everything you need to run a modern clinic"
            description="A complete suite of tools designed to transform how you manage patient care, from first appointment to final payment."
            className="mx-auto text-center max-w-4xl"
          />
        </Reveal>

        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <Reveal key={feature.title} delay={index * 0.08}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`group relative ${feature.span ?? ""}`}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
                  
                  {/* Card */}
                  <div className={`relative h-full rounded-3xl border border-slate-200/60 bg-white/80 p-8 backdrop-blur-xl shadow-lg shadow-slate-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-slate-300/50 group-hover:border-slate-300 ${feature.featured ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700' : ''}`}>
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-xl ${feature.featured ? 'bg-white/10 text-white' : ''}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className={`mt-6 text-xl font-semibold ${feature.featured ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                    <p className={`mt-3 leading-relaxed ${feature.featured ? 'text-slate-300' : 'text-slate-600'}`}>{feature.description}</p>
                    
                    {/* Hover indicator */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className={`mt-6 flex items-center gap-2 text-sm font-medium ${feature.featured ? 'text-cyan-400' : 'text-blue-600'}`}
                    >
                      <span>Explore feature</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </motion.div>

                    {/* Mini UI preview for featured cards */}
                    {feature.featured && (
                      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-red-400/80" />
                            <div className="h-2 w-2 rounded-full bg-yellow-400/80" />
                            <div className="h-2 w-2 rounded-full bg-emerald-400/80" />
                          </div>
                          <div className="flex-1 h-2 rounded-full bg-white/10" />
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-2 w-3/4 rounded-full bg-white/10" />
                          <div className="h-2 w-1/2 rounded-full bg-white/10" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        {/* Feature highlight */}
        <Reveal delay={0.8}>
          <div className="mt-20 rounded-[2.5rem] border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-white shadow-2xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                    <LayoutDashboard className="h-6 w-6 text-cyan-400" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-cyan-400">Unified Dashboard</span>
                </div>
                <h3 className="text-3xl font-semibold sm:text-4xl">
                  Everything in one place
                </h3>
                <p className="mt-4 text-lg text-slate-300 leading-relaxed">
                  A single command center for your entire clinic. View appointments, manage patients, track revenue, and monitor performance—all from one beautifully designed interface.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-sm text-slate-300">Real-time updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-sm text-slate-300">Cross-device sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-sm text-slate-300">Role-based access</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20 blur-2xl" />
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <CalendarRange className="h-5 w-5 text-cyan-400" />
                        <span className="text-sm">Today's Appointments</span>
                      </div>
                      <span className="text-2xl font-bold">28</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-emerald-400" />
                        <span className="text-sm">Active Patients</span>
                      </div>
                      <span className="text-2xl font-bold">142</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-amber-400" />
                        <span className="text-sm">Today's Revenue</span>
                      </div>
                      <span className="text-2xl font-bold">$19.2k</span>
                    </div>
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
