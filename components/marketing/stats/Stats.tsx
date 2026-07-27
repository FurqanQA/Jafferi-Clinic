"use client";

import { motion } from "framer-motion";
import { memo } from "react";

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

function Stats() {
  return (
    <section aria-labelledby="stats-heading" className="bg-gradient-to-r from-emerald-600 to-green-700 py-12 text-white sm:py-16 md:py-20 lg:py-24 xl:py-28">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sr-only">
          <h2 id="stats-heading">Key Statistics</h2>
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ scale: 1.05 }}
              className="rounded-2xl bg-white/10 p-5 backdrop-blur-md sm:rounded-3xl sm:p-8"
            >
              <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">
                {stat.value}
              </h2>

              <p className="mt-2 text-sm text-white/80 sm:mt-3 sm:text-base">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(Stats);
