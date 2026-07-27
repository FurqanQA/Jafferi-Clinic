"use client";

import { motion } from "framer-motion";
import { memo } from "react";

const clinics = [
  "Al Shifa",
  "Medicare",
  "Noor Clinics",
  "DentalCare",
  "Physio360",
  "SkinCare Labs",
];

function TrustedBy() {
  return (
    <section aria-labelledby="trusted-by-heading" className="border-y border-border/50 bg-muted/30 py-8 sm:py-10 md:py-12 lg:py-14">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          id="trusted-by-heading"
          className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:mb-6 sm:text-xs sm:tracking-[0.3em] md:mb-8"
        >
          Trusted by Modern Clinics
        </motion.p>

        <ul className="grid grid-cols-2 gap-3 text-center sm:gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-6 lg:gap-8" role="list">
          {clinics.map((clinic) => (
            <li key={clinic}>
              <motion.div
                whileHover={{
                  y: -4,
                  scale: 1.05,
                }}
                className="rounded-xl border border-border/50 bg-white p-3 font-semibold text-xs text-gray-700 shadow-sm transition sm:p-4 sm:text-sm"
              >
                {clinic}
              </motion.div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default memo(TrustedBy);
