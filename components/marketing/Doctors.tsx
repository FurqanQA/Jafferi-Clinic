"use client";

import { motion } from "framer-motion";
import { BriefcaseMedical, Star, Calendar, Clock } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";

const doctors = [
  {
    name: "Dr. Maya Hassan",
    role: "Chief Medical Officer",
    specialty: "Internal Medicine",
    bio: "A calm operator known for building patient-centered care journeys with precision and empathy.",
    rating: "4.9",
    experience: "15+ years",
    availability: "Today at 2:00 PM",
    initials: "MH",
  },
  {
    name: "Dr. Leo Chen",
    role: "Director of Specialty Care",
    specialty: "Cardiology",
    bio: "Brings elegant systems thinking to modern clinic operations, ensuring seamless patient experiences.",
    rating: "4.8",
    experience: "12+ years",
    availability: "Tomorrow at 10:00 AM",
    initials: "LC",
  },
  {
    name: "Dr. Nina Patel",
    role: "Head of Experience",
    specialty: "Family Medicine",
    bio: "Specializes in creating smooth, reassuring digital care experiences that put patients first.",
    rating: "5.0",
    experience: "8+ years",
    availability: "This week",
    initials: "NP",
  },
];

export function Doctors() {
  return (
    <Section className="bg-gradient-to-b from-slate-50/50 to-white">
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Our Doctors"
            title="World-class clinicians, premium care."
            description="The team behind Jafferi Clinic blends exceptional medical expertise with thoughtful, patient-centered design."
            className="max-w-3xl mx-auto text-center"
          />
        </Reveal>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {doctors.map((doctor, index) => (
            <Reveal key={doctor.name} delay={index * 0.08}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="group"
              >
                <div className="rounded-[2rem] border border-slate-200/60 bg-white/80 p-8 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-[0_30px_80px_-20px_rgba(15,23,42,0.3)] hover:border-slate-300">
                  {/* Avatar */}
                  <div className="relative mx-auto mb-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-2xl font-semibold text-white shadow-xl">
                      {doctor.initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 border-4 border-white">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  </div>

                  {/* Name and Role */}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-900">{doctor.name}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-600">{doctor.role}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{doctor.specialty}</p>
                  </div>

                  {/* Bio */}
                  <p className="mt-6 text-center text-sm leading-relaxed text-slate-600">{doctor.bio}</p>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-lg font-bold text-slate-900">{doctor.rating}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Rating</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-lg font-bold text-slate-900">{doctor.experience}</p>
                      <p className="mt-1 text-xs text-slate-500">Experience</p>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">{doctor.availability}</span>
                  </div>

                  {/* CTA Button */}
                  <Button className="mt-6 w-full h-12 rounded-full bg-slate-900 text-white font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-300">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
