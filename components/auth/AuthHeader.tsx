"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthHeader() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: .4,
      }}
      className="flex items-center justify-between"
    >

      <Link
        href="/"
        className="flex items-center gap-3"
      >
        <Image
          src="/images/logo.png"
          alt="Jafferi Clinic"
          width={48}
          height={48}
          priority
        />

        <div>

          <h2 className="text-xl font-bold text-slate-900">
            Jafferi Clinic
          </h2>

          <p className="text-sm text-slate-500">
            Clinic Management Software
          </p>

        </div>

      </Link>

      <Link
        href="/"
        className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
      >
        ← Back to Home
      </Link>

    </motion.div>
  );
}