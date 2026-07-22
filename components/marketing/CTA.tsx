"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/shared/Reveal";

export function CTA() {
  return (
    <Section className="bg-gradient-to-b from-white to-slate-50/50">
      <Container>
        <Reveal>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-[3rem] border border-slate-200/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 sm:p-16 text-white shadow-[0_50px_150px_-50px_rgba(15,23,42,0.6)]"
          >
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.15),_transparent_50%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.1),_transparent_50%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
            
            <div className="relative">
              <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                      <Sparkles className="h-6 w-6 text-cyan-400" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">Ready to modernize your clinic?</p>
                  </div>
                  <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
                    Transform your clinic operations today.
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-slate-300">
                    Join hundreds of premium healthcare providers who trust Jafferi Clinic to deliver exceptional patient experiences.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                  <Link href="/book-appointment">
                    <Button className="h-14 w-full rounded-full bg-white px-8 text-sm font-semibold text-slate-900 shadow-xl shadow-white/10 hover:bg-slate-100 hover:shadow-xl hover:shadow-white/20 transition-all duration-300">
                      Book Appointment <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" className="h-14 w-full rounded-full border-white/20 bg-white/5 px-8 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-all duration-300">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                <div>
                  <p className="text-3xl font-bold text-white">28+</p>
                  <p className="mt-2 text-sm text-slate-400">Active Clinics</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">12k+</p>
                  <p className="mt-2 text-sm text-slate-400">Daily Users</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">99.9%</p>
                  <p className="mt-2 text-sm text-slate-400">Uptime SLA</p>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </Container>
    </Section>
  );
}
