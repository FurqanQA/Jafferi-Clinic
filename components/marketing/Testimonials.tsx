"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";

const testimonials = [
  {
    quote: "The booking experience feels so polished. Patients love it, and our team finally has breathing room. It's transformed how we operate.",
    author: "Nadia Brooks",
    role: "Practice Manager",
    clinic: "Brooks Family Health",
    rating: 5,
  },
  {
    quote: "Jafferi Clinic made our daily rhythm feel calmer, clearer, and much more patient-centered. The ROI was visible within the first month.",
    author: "Samir Rahman",
    role: "Operations Lead",
    clinic: "Rahman Medical Group",
    rating: 5,
  },
  {
    quote: "It doesn't just look beautiful—it genuinely helps us run a smarter clinic every day. Our patient satisfaction scores increased by 40%.",
    author: "Elena Torres",
    role: "Director of Care",
    clinic: "Torres Wellness Center",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <Section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-blue-50/30 py-32">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[80px]" />
      </div>
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Testimonials"
            title="Trusted by healthcare leaders worldwide"
            description="See why clinics of all sizes choose Jafferi Clinic to transform their operations and deliver exceptional patient experiences."
            className="max-w-4xl mx-auto text-center"
          />
        </Reveal>
        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.author} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-emerald-500/20 opacity-0 blur-2xl group-hover:opacity-40 transition-opacity duration-500" />
                
                {/* Card */}
                <div className="relative h-full rounded-3xl border border-slate-200/60 bg-white/90 p-10 backdrop-blur-xl shadow-lg shadow-slate-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-slate-300/50 group-hover:border-slate-300">
                  {/* Quote Icon */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-xl">
                    <Quote className="h-7 w-7" />
                  </div>

                  {/* Rating */}
                  <div className="mt-6 flex gap-1.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 + i * 0.1 }}
                      >
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="mt-6 text-xl leading-relaxed text-slate-700 font-medium">{testimonial.quote}</p>

                  {/* Author */}
                  <div className="mt-8 pt-6 border-t border-slate-200/60">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-lg">
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-lg">{testimonial.author}</p>
                        <p className="mt-1 text-sm text-slate-600">{testimonial.role}</p>
                        <p className="mt-1 text-xs font-medium text-blue-600 uppercase tracking-wider">{testimonial.clinic}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>

        {/* Stats bar */}
        <Reveal delay={0.6}>
          <div className="mt-20 rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-900 to-slate-800 p-12 text-white shadow-2xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <p className="text-5xl font-bold tracking-tight">98%</p>
                <p className="mt-3 text-sm font-medium text-slate-300">Customer Satisfaction</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold tracking-tight">40%</p>
                <p className="mt-3 text-sm font-medium text-slate-300">Efficiency Increase</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold tracking-tight">2.5x</p>
                <p className="mt-3 text-sm font-medium text-slate-300">ROI First Year</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold tracking-tight">24/7</p>
                <p className="mt-3 text-sm font-medium text-slate-300">Support Available</p>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
