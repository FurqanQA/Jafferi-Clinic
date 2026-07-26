"use client";

import { motion } from "framer-motion";

const clinics = [
  "Al Shifa",
  "Medicare",
  "Noor Clinics",
  "DentalCare",
  "Physio360",
  "SkinCare Labs",
];

export default function TrustedBy() {
  return (
    <section className="border-y bg-muted/30 py-14">
      <div className="container mx-auto max-w-7xl px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mb-10 text-center text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground"
        >
          Trusted by Modern Clinics
        </motion.p>

        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-3 lg:grid-cols-6">
          {clinics.map((clinic) => (
            <motion.div
              whileHover={{
                y: -4,
                scale: 1.05,
              }}
              key={clinic}
              className="rounded-xl border bg-white p-5 font-semibold text-gray-700 shadow-sm transition"
            >
              {clinic}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}