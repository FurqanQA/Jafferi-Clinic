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
    <section className="relative overflow-hidden py-32">
      {/* Background */}

      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700" />

      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="container relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl rounded-[40px] border border-white/20 bg-white/10 p-14 text-center backdrop-blur-xl"
        >
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white">
            🚀 Start Growing Your Clinic Today
          </span>

          <h2 className="mt-8 text-5xl font-black leading-tight text-white lg:text-6xl">
            Ready to Modernize
            <br />
            Your Clinic?
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-white/80">
            Join modern healthcare providers using Jafferi Clinic to
            manage appointments, patients, billing and analytics from
            one powerful platform.
          </p>

          <div className="mt-12 flex flex-col justify-center gap-5 sm:flex-row">
            <Button
              size="lg"
              className="rounded-full bg-white px-8 text-emerald-700 hover:bg-white"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Free Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white bg-transparent px-8 text-white hover:bg-white/10"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-10 text-white/80">
            <div>✓ Free Setup</div>
            <div>✓ Secure Cloud</div>
            <div>✓ 24/7 Support</div>
            <div>✓ No Credit Card</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}