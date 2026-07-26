"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function DashboardPreview() {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-emerald-200 blur-[150px]" />

      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Dashboard Preview
          </span>

          <h2 className="mt-6 text-4xl font-bold lg:text-5xl">
            Manage Your Entire Clinic
            <br />
            From One Dashboard
          </h2>

          <p className="mt-6 text-lg text-muted-foreground">
            View appointments, patients, doctors, revenue and analytics
            in one beautifully designed dashboard.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: .95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: .5 }}
          viewport={{ once: true }}
          className="relative mt-20"
        >
          <Image
            src="/images/dashboard-preview.png"
            alt="Dashboard Preview"
            width={1400}
            height={900}
            className="rounded-[32px] border shadow-2xl"
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
            className="absolute -left-6 top-10 hidden w-64 rounded-2xl border bg-white p-5 shadow-2xl lg:block"
          >
            <p className="text-sm text-muted-foreground">
              Today's Appointments
            </p>

            <h3 className="mt-2 text-4xl font-bold">
              28
            </h3>

            <p className="mt-2 text-sm text-green-600">
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
            className="absolute -right-6 bottom-20 hidden w-72 rounded-2xl border bg-white p-6 shadow-2xl lg:block"
          >
            <p className="text-sm text-muted-foreground">
              Monthly Revenue
            </p>

            <h3 className="mt-3 text-4xl font-bold">
              $18,400
            </h3>

            <div className="mt-4 h-3 rounded-full bg-gray-100">
              <div className="h-3 w-[75%] rounded-full bg-emerald-500"></div>
            </div>

            <p className="mt-4 text-sm text-emerald-600">
              75% Monthly Target Achieved
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}