"use client";

import { motion } from "framer-motion";

const stats = [
  {
    value: "10K+",
    label: "Appointments Managed",
  },
  {
    value: "2K+",
    label: "Patients Registered",
  },
  {
    value: "99.9%",
    label: "Platform Uptime",
  },
  {
    value: "24/7",
    label: "Customer Support",
  },
];

export default function Stats() {
  return (
    <section className="bg-gradient-to-r from-emerald-600 to-green-700 py-16 text-white sm:py-20 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-white/10 p-6 backdrop-blur-md sm:rounded-3xl sm:p-8"
            >
              <h2 className="text-4xl font-black sm:text-5xl">
                {stat.value}
              </h2>

              <p className="mt-3 text-base text-white/80 sm:mt-4 sm:text-lg">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
