"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-44 pb-24">
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-emerald-200 blur-[140px]" />

      <div className="absolute right-0 top-20 h-[450px] w-[450px] rounded-full bg-blue-200 blur-[140px]" />

      <div className="container mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            AI Powered Clinic Software
          </span>

          <h1 className="mt-6 text-5xl font-black leading-tight lg:text-7xl">
            Manage Your Clinic.
            <br />
            <span className="text-emerald-600">
              Simplify Every Appointment.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Modern clinic management software that helps healthcare providers
            manage appointments, patients, billing, doctors, reports, and
            analytics from one dashboard.
          </p>

          <div className="mt-10 flex gap-4">
            <Button
              size="lg"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700"
            >
              Book Demo
            </Button>

            <Button variant="outline" size="lg" className="rounded-full">
              Explore Features
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: .9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Image
            src="/images/dashboard-preview.png"
            alt="Dashboard"
            width={900}
            height={650}
            priority
            className="rounded-3xl border shadow-2xl"
          />
        </motion.div>
      </div>
    </section>
  );
}