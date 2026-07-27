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
    <section aria-labelledby="cta-heading" className="relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
      {/* Background */}

      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700" />

      <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl sm:-left-32 sm:h-96 sm:w-96" aria-hidden="true" />

      <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl sm:-right-32 sm:h-96 sm:w-96" aria-hidden="true" />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-4xl rounded-[24px] border border-white/20 bg-white/10 p-6 text-center backdrop-blur-xl sm:rounded-[32px] sm:p-10 lg:rounded-[40px] lg:p-14"
        >
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white sm:px-4 sm:py-2 sm:text-sm">
            ?? Start Growing Your Clinic Today
          </span>

          <h2 id="cta-heading" className="mt-5 text-3xl font-black leading-tight text-white sm:mt-6 sm:text-4xl lg:text-5xl lg:text-6xl">
            Ready to Modernize
            <br />
            Your Clinic?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/80 sm:mt-6 sm:text-lg sm:leading-8">
            Join modern healthcare providers using Jafferi Clinic to
            manage appointments, patients, billing and analytics from
            one powerful platform.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="w-full rounded-full bg-white px-6 text-emerald-700 hover:bg-white sm:w-auto sm:px-8"
            >
              <Calendar className="mr-2 h-5 w-5" aria-hidden="true" />
              Book Free Demo
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full border-white bg-transparent px-6 text-white hover:bg-white/10 sm:w-auto sm:px-8"
            >
              <Play className="mr-2 h-5 w-5" aria-hidden="true" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-white/80 sm:mt-8 sm:gap-6">
            <div className="text-xs sm:text-sm">? Free Setup</div>
            <div className="text-xs sm:text-sm">? Secure Cloud</div>
            <div className="text-xs sm:text-sm">? 24/7 Support</div>
            <div className="text-xs sm:text-sm">? No Credit Card</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
