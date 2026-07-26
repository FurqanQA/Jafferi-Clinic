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
      className="py-28 bg-gradient-to-b from-white to-emerald-50/30"
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Testimonials
          </span>

          <h2 className="mt-6 text-4xl lg:text-5xl font-bold">
            Loved by Healthcare Professionals
          </h2>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="rounded-3xl border bg-white p-8 shadow-lg"
            >
              <div className="flex text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>

              <p className="mt-6 leading-8 text-muted-foreground">
                "{item.review}"
              </p>

              <div className="mt-8">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.role}
                </p>
                <p className="text-sm font-medium text-emerald-600">
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