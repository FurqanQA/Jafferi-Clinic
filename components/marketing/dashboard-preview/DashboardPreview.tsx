"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function DashboardPreview() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24 md:py-32">
      <div className="absolute left-0 top-0 h-[300px] w-[300px] rounded-full bg-emerald-200 blur-[100px] sm:h-[400px] sm:w-[400px] sm:blur-[120px] md:h-[500px] md:w-[500px] md:blur-[150px]" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:px-4 sm:py-2 sm:text-sm">
            Dashboard Preview
          </span>

          <h2 className="mt-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Manage Your Entire Clinic
            <br />
            From One Dashboard
          </h2>

          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            View appointments, patients, doctors, revenue and analytics
            in one beautifully designed dashboard.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative mt-12 sm:mt-16 md:mt-20"
        >
          <Image
            src="/images/dashboard-preview.png"
            alt="Dashboard Preview"
            width={1400}
            height={900}
            className="w-full rounded-2xl border shadow-2xl sm:rounded-3xl"
          />

          {/* Appointment Card */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
            className="absolute -left-4 top-8 hidden w-56 rounded-2xl border bg-white p-4 shadow-2xl sm:-left-6 sm:top-10 sm:w-64 sm:p-5 lg:block"
          >
            <p className="text-xs text-muted-foreground sm:text-sm">
              Today's Appointments
            </p>

            <h3 className="mt-2 text-3xl font-black sm:mt-2 sm:text-4xl">
              28
            </h3>

            <p className="mt-2 text-xs text-green-600 sm:mt-2 sm:text-sm">
              +12% from yesterday
            </p>
          </motion.div>

          {/* Revenue Card */}
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
            }}
            className="absolute -right-4 bottom-16 hidden w-64 rounded-2xl border bg-white p-5 shadow-2xl sm:-right-6 sm:bottom-20 sm:w-72 sm:p-6 lg:block"
          >
            <p className="text-xs text-muted-foreground sm:text-sm">
              Monthly Revenue
            </p>

            <h3 className="mt-3 text-3xl font-black sm:mt-3 sm:text-4xl">
              $18,400
            </h3>

            <div className="mt-4 h-2.5 rounded-full bg-gray-100 sm:mt-4 sm:h-3">
              <div className="h-2.5 w-[75%] rounded-full bg-emerald-500 sm:h-3"></div>
            </div>

            <p className="mt-4 text-xs text-emerald-600 sm:mt-4 sm:text-sm">
              75% Monthly Target Achieved
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
