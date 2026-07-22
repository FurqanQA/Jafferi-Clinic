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
    <Section className="bg-gradient-to-b from-white to-slate-50/50">
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Testimonials"
            title="Loved by clinics that value calm, modern operations."
            description="Our customers use Jafferi Clinic to create smoother journeys from the very first touchpoint to lasting care relationships."
            className="max-w-3xl mx-auto text-center"
          />
        </Reveal>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.author} delay={index * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-full rounded-[2rem] border border-slate-200/60 bg-white/80 p-8 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)] hover:border-slate-300">
                  {/* Quote Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Quote className="h-6 w-6" />
                  </div>

                  {/* Rating */}
                  <div className="mt-6 flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="mt-6 text-lg leading-relaxed text-slate-700">{testimonial.quote}</p>

                  {/* Author */}
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <p className="font-semibold text-slate-900">{testimonial.author}</p>
                    <p className="mt-1 text-sm text-slate-600">{testimonial.role}</p>
                    <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wider">{testimonial.clinic}</p>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
