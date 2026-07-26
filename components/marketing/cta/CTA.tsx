"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Play,
} from "lucide-react";

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24 md:py-32">
      {/* Background */}

      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700" />

      <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl sm:-left-32 sm:h-96 sm:w-96" />

      <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl sm:-right-32 sm:h-96 sm:w-96" />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl rounded-[32px] border border-white/20 bg-white/10 p-8 text-center backdrop-blur-xl sm:rounded-[40px] sm:p-14"
        >
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white sm:px-5 sm:py-2 sm:text-sm">
            ?? Start Growing Your Clinic Today
          </span>

          <h2 className="mt-6 text-3xl font-black leading-tight text-white sm:mt-8 sm:text-4xl lg:text-5xl lg:text-6xl">
            Ready to Modernize
            <br />
            Your Clinic?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/80 sm:mt-8 sm:text-xl sm:leading-8">
            Join modern healthcare providers using Jafferi Clinic to
            manage appointments, patients, billing and analytics from
            one powerful platform.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:mt-12 sm:flex-row sm:gap-5">
            <Button
              size="lg"
              className="rounded-full bg-white px-6 text-emerald-700 hover:bg-white sm:px-8"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Free Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white bg-transparent px-6 text-white hover:bg-white/10 sm:px-8"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/80 sm:mt-12 sm:gap-10">
            <div className="text-sm sm:text-base">? Free Setup</div>
            <div className="text-sm sm:text-base">? Secure Cloud</div>
            <div className="text-sm sm:text-base">? 24/7 Support</div>
            <div className="text-sm sm:text-base">? No Credit Card</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
