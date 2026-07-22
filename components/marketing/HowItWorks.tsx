"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck2, ClipboardList, CreditCard, MapPin, Smartphone, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";

const steps = [
  { title: "Choose department", description: "Select your specialty with intelligent routing to the right care team.", icon: ClipboardList },
  { title: "Choose doctor", description: "Browse profiles, availability, and patient reviews to find your perfect match.", icon: CalendarCheck2 },
  { title: "Select time", description: "Pick from premium appointment slots with smart scheduling suggestions.", icon: Sparkles },
  { title: "Payment", description: "Secure, transparent billing with insurance integration and multiple payment options.", icon: CreditCard },
  { title: "Receive token", description: "Get your digital token instantly via SMS, email, or our patient app.", icon: Smartphone },
  { title: "Visit clinic", description: "Arrive with confidence—your check-in is seamless and your care team is ready.", icon: MapPin },
];

export function HowItWorks() {
  return (
    <Section className="bg-gradient-to-b from-slate-50/50 to-white">
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="How it works"
            title="A six-step journey built for premium care delivery."
            description="The patient experience feels as polished and sophisticated as your clinic itself."
            className="max-w-3xl mx-auto text-center"
          />
        </Reveal>
        
        <div className="mt-16 relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 md:left-1/2 md:-translate-x-1/2" />
          
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <Reveal key={step.title} delay={index * 0.08}>
                  <div className={`relative flex items-center gap-8 md:gap-12 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    {/* Number badge */}
                    <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-xl">
                      <span className="text-lg font-bold">{index + 1}</span>
                    </div>
                    
                    {/* Content card */}
                    <motion.div
                      whileHover={{ x: isEven ? 4 : -4 }}
                      transition={{ duration: 0.2 }}
                      className={`flex-1 rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-lg hover:border-slate-300 md:p-8 ${!isEven ? "md:text-right" : ""}`}
                    >
                      <div className={`flex items-center gap-4 ${!isEven ? "md:flex-row-reverse" : ""}`}>
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                          <p className="mt-2 text-base leading-relaxed text-slate-600">{step.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="mt-16 flex justify-center"
          >
            <a
              href="/book-appointment"
              className="inline-flex items-center gap-3 rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-slate-900/25 transition-all duration-300 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30"
            >
              Book your first appointment <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </Reveal>
      </Container>
    </Section>
  );
}
