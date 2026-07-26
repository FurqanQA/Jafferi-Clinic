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
    <section className="border-y bg-muted/30 py-10 sm:py-12 md:py-14">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:mb-8 sm:text-xs sm:tracking-[0.3em] md:mb-10"
        >
          Trusted by Modern Clinics
        </motion.p>

        <div className="grid grid-cols-2 gap-4 text-center sm:gap-6 sm:grid-cols-3 md:gap-8 lg:grid-cols-6">
          {clinics.map((clinic) => (
            <motion.div
              whileHover={{
                y: -4,
                scale: 1.05,
              }}
              key={clinic}
              className="rounded-xl border bg-white p-4 font-semibold text-sm text-gray-700 shadow-sm transition sm:p-5 sm:text-base"
            >
              {clinic}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
