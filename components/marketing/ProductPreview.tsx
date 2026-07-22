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
    <Section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-32">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(37,99,235,0.15),_transparent_50%)]" />
      </div>
      <Container className="relative">
        <Reveal>
          <SectionTitle
            eyebrow="Product Showcase"
            title="See the platform in action"
            description="Experience the complete healthcare operating system with our interactive product preview. Every screen is designed to feel calm, clear, and premium."
            className="mx-auto text-center max-w-4xl"
          />
        </Reveal>

        {/* MacBook-style mockup */}
        <Reveal delay={0.2}>
          <div className="mt-20 relative mx-auto max-w-5xl">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-emerald-500/30 blur-3xl" />
            
            {/* MacBook frame */}
            <div className="relative rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 p-3 shadow-2xl">
              {/* Screen */}
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 to-slate-900 p-8">
                {/* Browser header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 h-8 rounded-full bg-white/5 backdrop-blur-sm flex items-center px-4">
                    <span className="text-sm text-slate-400">dashboard.jaffericlinic.com</span>
                  </div>
                </div>
                
                {/* Dashboard content */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Sidebar */}
                  <div className="space-y-3">
                    {products.slice(0, 3).map((product) => {
                      const Icon = product.icon;
                      return (
                        <motion.div
                          key={product.name}
                          whileHover={{ x: 4 }}
                          className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 cursor-pointer ${product.name === 'Dashboard' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'}`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${product.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-sm font-medium text-white">{product.name}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {/* Main content */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">Today's Overview</h4>
                        <span className="text-sm text-emerald-400">+24% vs yesterday</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl bg-white/5 p-4">
                          <p className="text-2xl font-bold text-white">28</p>
                          <p className="text-xs text-slate-400 mt-1">Appointments</p>
                        </div>
                        <div className="rounded-xl bg-white/5 p-4">
                          <p className="text-2xl font-bold text-white">142</p>
                          <p className="text-xs text-slate-400 mt-1">Patients</p>
                        </div>
                        <div className="rounded-xl bg-white/5 p-4">
                          <p className="text-2xl font-bold text-white">$19.2k</p>
                          <p className="text-xs text-slate-400 mt-1">Revenue</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                      <h4 className="text-lg font-semibold text-white mb-4">Upcoming Appointments</h4>
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-4 rounded-xl bg-white/5 p-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">Patient {i}</p>
                              <p className="text-xs text-slate-400">Cardiology • {9 + i}:00 AM</p>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* MacBook base */}
            <div className="mx-auto mt-3 h-2 w-32 rounded-b-full bg-gradient-to-b from-slate-700 to-slate-800" />
          </div>
        </Reveal>

        {/* Product features grid */}
        <div className="mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => {
            const Icon = product.icon;
            return (
              <Reveal key={product.name} delay={0.4 + index * 0.08}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative"
                >
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${product.color} opacity-0 blur-2xl group-hover:opacity-30 transition-opacity duration-500`} />
                  <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/10">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${product.color} shadow-xl`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-white">{product.name}</h3>
                    <p className="mt-3 text-slate-400 leading-relaxed">{product.description}</p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-slate-300 group-hover:text-white transition-colors">
                      <span className="font-medium">Learn more</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        {/* CTA */}
        <Reveal delay={0.8}>
          <div className="mt-20 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-12 backdrop-blur-xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                    <Sparkles className="h-6 w-6 text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Live Demo</span>
                </div>
                <h3 className="text-3xl font-semibold text-white sm:text-4xl">
                  Experience it yourself
                </h3>
                <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                  Get a personalized walkthrough of the platform. See how Jafferi Clinic transforms your operations in real-time with our expert team.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-500/30 transition-all duration-300 hover:shadow-blue-500/40"
                >
                  Schedule Demo <Sparkles className="h-4 w-4" />
                </motion.button>
              </div>
              <div className="flex items-center justify-center lg:justify-end">
                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                    <p className="text-5xl font-bold text-white">28+</p>
                    <p className="mt-3 text-sm text-slate-400">Active clinics</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                    <p className="text-5xl font-bold text-white">12k+</p>
                    <p className="mt-3 text-sm text-slate-400">Daily users</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                    <p className="text-5xl font-bold text-white">99.9%</p>
                    <p className="mt-3 text-sm text-slate-400">Uptime</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                    <p className="text-5xl font-bold text-white">4.9</p>
                    <p className="mt-3 text-sm text-slate-400">Rating</p>
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
