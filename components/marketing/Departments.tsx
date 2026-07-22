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
    <Section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/30 py-32">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 right-1/4 w-[700px] h-[700px] bg-blue-400/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[100px]" />
      </div>
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Departments"
            title="Specialized care, unified experience"
            description="Every department is purpose-built with workflows that match your specialty while maintaining a consistent premium patient experience."
            className="max-w-4xl mx-auto text-center"
          />
        </Reveal>
        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((department, index) => {
            const Icon = department.icon;
            return (
              <Reveal key={department.title} delay={index * 0.08}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative"
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${department.color} opacity-0 blur-2xl group-hover:opacity-25 transition-opacity duration-500`} />
                  
                  {/* Card */}
                  <div className="relative rounded-3xl border border-slate-200/60 bg-white/90 p-8 backdrop-blur-xl shadow-lg shadow-slate-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-slate-300/50 group-hover:border-slate-300">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${department.color} text-white shadow-xl`">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-slate-900">{department.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{department.description}</p>
                    
                    {/* Hover indicator */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-600"
                    >
                      <span>Book appointment</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </motion.div>
                    
                    {/* Mini stats preview */}
                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Available doctors</span>
                        <span className="font-semibold text-slate-700">{Math.floor(Math.random() * 5) + 2}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                        <span>Wait time</span>
                        <span className="font-semibold text-emerald-600">{Math.floor(Math.random() * 15) + 5} min</span>
                      </div>
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
