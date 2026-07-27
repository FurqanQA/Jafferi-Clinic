"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-44 md:pb-24">
      <div className="absolute left-0 top-0 h-[300px] w-[300px] rounded-full bg-emerald-200 blur-[100px] sm:h-[400px] sm:w-[400px] sm:blur-[120px] md:h-[500px] md:w-[500px] md:blur-[140px]" />

      <div className="absolute right-0 top-10 h-[250px] w-[250px] rounded-full bg-blue-200 blur-[100px] sm:top-16 sm:h-[350px] sm:w-[350px] sm:blur-[120px] md:top-20 md:h-[450px] md:w-[450px] md:blur-[140px]" />

      <div className="container mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center lg:text-left"
        >
          <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:px-4 sm:py-2 sm:text-sm">
            AI Powered Clinic Software
          </span>

          <h1 className="mt-6 text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Manage Your Clinic.
            <br />
            <span className="text-emerald-600">
              Simplify Every Appointment.
            </span>
          </h1>

          <p className="mt-6 text-base text-muted-foreground sm:text-lg lg:max-w-xl">
            Modern clinic management software that helps healthcare providers
            manage appointments, patients, billing, doctors, reports, and
            analytics from one dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4 lg:justify-start">
            <Button
              size="lg"
              className="rounded-full bg-emerald-600 px-6 hover:bg-emerald-700 sm:px-8"
            >
              Book Demo
            </Button>

            <Button variant="outline" size="lg" className="rounded-full px-6 sm:px-8">
              Explore Features
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative order-first lg:order-last"
        >
          <Image
            src="/images/dashboard-preview.png"
            alt="Dashboard"
            width={900}
            height={650}
            priority
            className="w-full rounded-2xl border sm:rounded-3xl"
          />
        </motion.div>
      </div>
    </section>
  );
}
