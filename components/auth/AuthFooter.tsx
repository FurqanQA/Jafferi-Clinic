"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthFooter() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        delay: 0.2,
      }}
      className="mt-8 text-center"
    >
      <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
        <p>© 2026 Jafferi Clinic</p>

        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="transition hover:text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Privacy Policy
          </Link>

          <Link
            href="/terms"
            className="transition hover:text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Terms of Service
          </Link>

          <Link
            href="/support"
            className="transition hover:text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Support
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
