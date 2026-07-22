"use client";

import { motion } from "framer-motion";
import { Stethoscope, HeartPulse, Microscope, BrainCircuit, Baby, Bone, Eye, Smile } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";

const departments = [
  { title: "Primary Care", description: "Comprehensive everyday health services with flexible intake and follow-up workflows.", icon: Stethoscope, color: "from-blue-500 to-cyan-500" },
  { title: "Cardiology", description: "Expert heart care with coordinated scheduling for diagnostics and treatment plans.", icon: HeartPulse, color: "from-rose-500 to-pink-500" },
  { title: "Diagnostics", description: "Advanced imaging and laboratory services with trusted booking experiences.", icon: Microscope, color: "from-violet-500 to-purple-500" },
  { title: "Neurology", description: "Specialized brain and nerve care with calm, organized patient journeys.", icon: BrainCircuit, color: "from-indigo-500 to-blue-500" },
  { title: "Pediatrics", description: "Child-focused healthcare with gentle, family-friendly care coordination.", icon: Baby, color: "from-amber-500 to-orange-500" },
  { title: "Orthopedics", description: "Bone and joint specialists with streamlined treatment planning.", icon: Bone, color: "from-emerald-500 to-teal-500" },
  { title: "Ophthalmology", description: "Complete eye care services from routine exams to surgical procedures.", icon: Eye, color: "from-sky-500 to-blue-500" },
  { title: "Dental", description: "Comprehensive dental services with modern scheduling and patient management.", icon: Smile, color: "from-fuchsia-500 to-pink-500" },
];

export function Departments() {
  return (
    <Section className="bg-gradient-to-b from-white to-slate-50/50">
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Departments"
            title="Purpose-built for every care setting."
            description="From boutique practices to multi-site networks, the experience scales with confidence."
            className="max-w-3xl mx-auto text-center"
          />
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {departments.map((department, index) => {
            const Icon = department.icon;
            return (
              <Reveal key={department.title} delay={index * 0.06}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="group relative"
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${department.color} opacity-0 blur-xl group-hover:opacity-20 transition-opacity duration-300`} />
                  <div className="relative rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-lg hover:border-slate-300">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${department.color} text-white shadow-lg`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-900">{department.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{department.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Book now</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
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
