"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck2, ClipboardList, CreditCard, MapPin, Smartphone, Sparkles, User, Clock, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";

const steps = [
  { 
    title: "Book Appointment", 
    description: "Select your department and doctor, then choose your preferred time slot from our intelligent scheduling system.", 
    icon: CalendarCheck2,
    color: "from-blue-500 to-cyan-500",
    preview: "calendar"
  },
  { 
    title: "Visit Clinic", 
    description: "Arrive at the clinic with your digital token ready for seamless check-in at our automated kiosks.", 
    icon: MapPin,
    color: "from-emerald-500 to-teal-500",
    preview: "location"
  },
  { 
    title: "Receive Token", 
    description: "Get your digital token instantly via SMS, email, or our patient app—no more waiting in uncertainty.", 
    icon: Smartphone,
    color: "from-violet-500 to-purple-500",
    preview: "token"
  },
  { 
    title: "Meet Doctor", 
    description: "Consult with your doctor in a calm, organized environment where they have your complete medical history.", 
    icon: User,
    color: "from-rose-500 to-pink-500",
    preview: "doctor"
  },
  { 
    title: "Follow-up", 
    description: "Receive automated reminders, prescription notifications, and access your medical records online.", 
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    preview: "followup"
  },
];

export function HowItWorks() {
  return (
    <Section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-blue-50/30 py-32">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[80px]" />
      </div>
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="How it works"
            title="A seamless patient journey"
            description="From booking to follow-up, every step is designed to feel effortless and premium."
            className="max-w-4xl mx-auto text-center"
          />
        </Reveal>
        
        <div className="mt-20 relative">
          {/* Animated timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-cyan-500 to-emerald-500 opacity-30 md:left-1/2 md:-translate-x-1/2" />
          
          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <Reveal key={step.title} delay={index * 0.1}>
                  <div className={`relative flex items-center gap-8 md:gap-12 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    {/* Animated number badge */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, delay: index * 0.2, repeat: Infinity }}
                      className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-2xl"
                    >
                      <span className="text-2xl font-bold">{index + 1}</span>
                    </motion.div>
                    
                    {/* Content card with UI preview */}
                    <motion.div
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex-1 rounded-3xl border border-slate-200/60 bg-white/90 p-8 backdrop-blur-xl shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/50 hover:border-slate-300 ${!isEven ? "md:text-right" : ""}`}
                    >
                      <div className={`flex items-start gap-6 ${!isEven ? "md:flex-row-reverse" : ""}`}>
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-xl`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-slate-900">{step.title}</h3>
                          <p className="mt-3 text-lg leading-relaxed text-slate-600">{step.description}</p>
                          
                          {/* Mini UI preview */}
                          <div className="mt-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-slate-400" />
                                <div className="h-2 w-2 rounded-full bg-slate-400" />
                                <div className="h-2 w-2 rounded-full bg-slate-400" />
                              </div>
                              <div className="flex-1 h-2 rounded-full bg-slate-200" />
                            </div>
                            {step.preview === "calendar" && (
                              <div className="grid grid-cols-4 gap-2">
                                {[...Array(8)].map((_, i) => (
                                  <div key={i} className="h-8 rounded-lg bg-white border border-slate-200" />
                                ))}
                              </div>
                            )}
                            {step.preview === "location" && (
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <MapPin className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-2 w-3/4 rounded-full bg-slate-200" />
                                  <div className="h-2 w-1/2 rounded-full bg-slate-200" />
                                </div>
                              </div>
                            )}
                            {step.preview === "token" && (
                              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
                                <div className="flex items-center gap-3">
                                  <Smartphone className="h-5 w-5" />
                                  <span className="text-sm font-semibold">Token #A-042</span>
                                </div>
                                <CheckCircle2 className="h-5 w-5" />
                              </div>
                            )}
                            {step.preview === "doctor" && (
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-slate-200" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-2 w-1/2 rounded-full bg-slate-200" />
                                  <div className="h-2 w-1/3 rounded-full bg-slate-200" />
                                </div>
                                <div className="flex items-center gap-2 text-emerald-600">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm font-medium">Available</span>
                                </div>
                              </div>
                            )}
                            {step.preview === "followup" && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                  <Sparkles className="h-4 w-4 text-amber-500" />
                                  <div className="flex-1 h-2 rounded-full bg-slate-200" />
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                  <CreditCard className="h-4 w-4 text-blue-500" />
                                  <div className="flex-1 h-2 rounded-full bg-slate-200" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <Reveal delay={0.8}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="mt-20 flex justify-center"
          >
            <a
              href="/book-appointment"
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-10 py-5 text-sm font-semibold text-white shadow-2xl shadow-blue-500/30 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-105"
            >
              Book your first appointment <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </Reveal>
      </Container>
    </Section>
  );
}
