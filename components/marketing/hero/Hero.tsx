"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section aria-label="Hero section" className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16 md:pt-36 md:pb-20 lg:pt-44 lg:pb-24 xl:pt-48 xl:pb-28">
      <div className="absolute left-0 top-0 h-[300px] w-[300px] rounded-full bg-emerald-200/60 blur-[120px] sm:h-[400px] sm:w-[400px] sm:blur-[140px] md:h-[500px] md:w-[500px] md:blur-[160px] lg:blur-[180px]" aria-hidden="true" />

      <div className="absolute right-0 top-10 h-[250px] w-[250px] rounded-full bg-blue-200/60 blur-[120px] sm:top-16 sm:h-[350px] sm:w-[350px] sm:blur-[140px] md:top-20 md:h-[450px] md:w-[450px] md:blur-[160px] lg:blur-[180px]" aria-hidden="true" />

      <div className="container mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 sm:gap-12 md:gap-14 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          <span className="badge-premium" role="status" aria-live="polite">
            AI Powered Clinic Software
          </span>

          <h1 className="mt-5 text-3xl font-black leading-tight sm:mt-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Manage Your Clinic.
            <br />
            <span className="text-emerald-600">
              Simplify Every Appointment.
            </span>
          </h1>

          <p className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg lg:max-w-xl">
            Modern clinic management software that helps healthcare providers
            manage appointments, patients, billing, doctors, reports, and
            analytics from one dashboard.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4 lg:justify-start">
            <Button
              size="lg"
              className="w-full rounded-full bg-emerald-600 px-6 hover:bg-emerald-700 sm:w-auto sm:px-8"
            >
              Book Demo
            </Button>

            <Button variant="outline" size="lg" className="w-full rounded-full px-6 sm:w-auto sm:px-8">
              Explore Features
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative order-first lg:order-last"
        >
          <Image
            src="/images/dashboard-preview.png"
            alt="Screenshot of Jafferi Clinic dashboard showing appointments, patients, and analytics in one view"
            width={900}
            height={650}
            priority
            className="w-full rounded-2xl border border-border/50 shadow-2xl sm:rounded-3xl"
          />
        </motion.div>
      </div>
    </section>
  );
}
