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
    <section className="bg-gradient-to-r from-emerald-600 to-green-700 py-24 text-white">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              viewport={{ once: true }}
              className="rounded-3xl bg-white/10 p-8 backdrop-blur-md"
            >
              <h2 className="text-5xl font-black">
                {stat.value}
              </h2>

              <p className="mt-4 text-lg text-white/80">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}