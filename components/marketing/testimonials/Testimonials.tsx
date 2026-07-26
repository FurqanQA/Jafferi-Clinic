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
      className="py-20 bg-gradient-to-b from-white to-emerald-50/30 sm:py-24 md:py-28"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:px-4 sm:py-2 sm:text-sm">
            Testimonials
          </span>

          <h2 className="mt-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Loved by Healthcare Professionals
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="rounded-2xl border bg-white p-6 shadow-lg sm:rounded-3xl sm:p-8"
            >
              <div className="flex text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" className="sm:size-[18px]" />
                ))}
              </div>

              <p className="mt-5 leading-7 text-muted-foreground sm:mt-6 sm:leading-8">
                "{item.review}"
              </p>

              <div className="mt-6 sm:mt-8">
                <h3 className="font-bold text-base sm:text-lg">{item.name}</h3>
                <p className="text-sm text-muted-foreground sm:text-sm">
                  {item.role}
                </p>
                <p className="text-sm font-medium text-emerald-600 sm:text-sm">
                  {item.company}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
