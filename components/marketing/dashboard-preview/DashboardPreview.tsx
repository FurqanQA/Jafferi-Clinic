"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { memo } from "react";

function DashboardPreview() {
  return (
    <section aria-labelledby="dashboard-preview-heading" className="relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
      <div className="absolute left-0 top-0 h-[250px] w-[250px] rounded-full bg-emerald-200/60 blur-[100px] sm:h-[350px] sm:w-[350px] sm:blur-[120px] md:h-[450px] md:w-[450px] md:blur-[140px] lg:blur-[160px]" aria-hidden="true" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl px-2 text-center sm:px-0">
          <span className="badge-premium">
            Dashboard Preview
          </span>

          <h2 id="dashboard-preview-heading" className="mt-6 text-3xl font-bold sm:mt-8 sm:text-4xl lg:text-5xl">
            Manage Your Entire Clinic
            <br />
            From One Dashboard
          </h2>

          <p className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg">
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
            alt="Dashboard interface showing appointments panel, patient records, revenue analytics, and doctor management in a unified view"
            width={1400}
            height={900}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC3AB//Z"
            className="w-full rounded-2xl border border-border/50 shadow-2xl sm:rounded-3xl"
          />

          {/* Appointment Card */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute -left-3 top-6 hidden w-48 rounded-2xl border border-border/50 bg-white p-3 shadow-2xl sm:-left-4 sm:top-8 sm:w-56 sm:p-4 md:-left-6 md:top-10 md:w-64 md:p-5 lg:block"
            aria-hidden="true"
          >
            <p className="text-xs text-muted-foreground sm:text-sm">
              Today's Appointments
            </p>

            <h3 className="mt-2 text-2xl font-black sm:mt-2 sm:text-3xl md:text-4xl">
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
              repeatType: "reverse",
            }}
            className="absolute -right-3 bottom-12 hidden w-56 rounded-2xl border border-border/50 bg-white p-4 shadow-2xl sm:-right-4 sm:bottom-16 sm:w-64 sm:p-5 md:-right-6 md:bottom-20 md:w-72 md:p-6 lg:block"
            aria-hidden="true"
          >
            <p className="text-xs text-muted-foreground sm:text-sm">
              Monthly Revenue
            </p>

            <h3 className="mt-3 text-2xl font-black sm:mt-3 sm:text-3xl md:text-4xl">
              $18,400
            </h3>

            <div className="mt-4 h-2 rounded-full bg-gray-100 sm:mt-4 sm:h-2.5 md:h-3">
              <div className="h-2 w-[75%] rounded-full bg-emerald-500 sm:h-2.5 md:h-3"></div>
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

export default memo(DashboardPreview);
