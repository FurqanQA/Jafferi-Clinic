"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Sarah Ahmed",
    role: "Dental Clinic",
    company: "Smile Care Center",
    review:
      "Jafferi Clinic transformed our daily workflow. Appointment scheduling and billing are now effortless.",
  },
  {
    name: "Dr. Muhammad Ali",
    role: "Medical Clinic",
    company: "Health Plus",
    review:
      "The dashboard gives us complete visibility over patients, appointments and revenue. Highly recommended.",
  },
  {
    name: "Dr. Ayesha Khan",
    role: "Physiotherapist",
    company: "Physio360",
    review:
      "Our staff saves hours every week thanks to automated reminders and digital patient records.",
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="py-16 bg-gradient-to-b from-white to-emerald-50/40 sm:py-20 md:py-24 lg:py-28 xl:py-32"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl px-2 text-center sm:px-0">
          <span className="badge-premium">
            Testimonials
          </span>

          <h2 id="testimonials-heading" className="mt-6 text-3xl font-bold sm:mt-8 sm:text-4xl lg:text-5xl">
            Loved by Healthcare Professionals
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:mt-20 lg:gap-8 xl:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:border-border/80 sm:rounded-3xl sm:p-8"
            >
              <div className="flex gap-0.5 text-yellow-500" aria-label="Rating: 5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" className="sm:size-[16px]" aria-hidden="true" />
                ))}
              </div>

              <blockquote className="mt-4 text-sm leading-6 text-muted-foreground sm:mt-6 sm:leading-7 sm:text-base italic">
                "{item.review}"
              </blockquote>

              <div className="mt-6 sm:mt-8">
                <h3 className="font-bold text-base sm:text-lg leading-tight">{item.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.role}, {item.company}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
