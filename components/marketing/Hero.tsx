"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BadgeCheck, Calendar, Clock, DollarSign, HeartPulse, ShieldCheck, Sparkles, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { MarketingBadge } from "@/components/shared/Badge";

const trustItems = ["HIPAA Ready", "Cloud Based", "99.9% Uptime"];

export function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const rotate = useTransform(scrollY, [0, 500], [0, 5]);

  return (
    <section className="relative overflow-hidden px-6 py-24 sm:px-8 lg:px-8 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.12),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,1))]" />
      <Container className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <MarketingBadge className="mb-8 bg-slate-900 text-white shadow-lg shadow-slate-900/20">
            Healthcare Operating System
          </MarketingBadge>
          <h1 className="text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl leading-[1.1]">
            Healthcare,
            <br />
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
              Beautifully Reimagined.
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-600">
            Jafferi Clinic transforms healthcare operations into a premium experience. Appointments, billing, communications, and patient journeys—orchestrated with calm precision.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/book-appointment">
              <Button className="h-14 rounded-full bg-slate-900 px-8 text-sm font-semibold text-white shadow-xl shadow-slate-900/25 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-300">
                Book Appointment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="h-14 rounded-full border-slate-300 px-8 text-sm font-semibold text-slate-700 bg-white/80 backdrop-blur-sm hover:bg-slate-50 hover:border-slate-400 transition-all duration-300">
                Request Demo
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            {trustItems.map((item) => (
              <motion.div 
                key={item}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm"
              >
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> {item}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          style={{ y: y1 }}
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-cyan-400/20 via-sky-300/15 to-emerald-400/20 blur-3xl" />
          
          {/* Main Dashboard */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/70 p-5 shadow-[0_50px_150px_-50px_rgba(15,23,42,0.4)] backdrop-blur-2xl">
            <div className="rounded-[2rem] border border-slate-200/50 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-white shadow-inner">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Dashboard</span>
                </div>
                <span className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
              
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Appointments Today</span>
                  </div>
                  <p className="mt-3 text-4xl font-semibold tracking-tight">28</p>
                  <p className="mt-1 text-xs text-emerald-400">+12% from yesterday</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Revenue Today</span>
                  </div>
                  <p className="mt-3 text-4xl font-semibold tracking-tight">$19.2k</p>
                  <p className="mt-1 text-xs text-emerald-400">+8% from yesterday</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-sky-500/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-500/20 p-2">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-cyan-100">AI Scheduling Active</p>
                    <p className="text-xs text-slate-400">Reduced no-shows by 34% this week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Card 1 - Doctor */}
          <motion.div 
            style={{ y: y2, rotate }}
            className="absolute -left-8 bottom-12 w-64 rounded-2xl border border-slate-200/60 bg-white/85 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-white">
                  <User className="h-5 w-5" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Dr. Sarah Chen</p>
                <p className="text-xs text-slate-500">Cardiology • Available</p>
              </div>
              <div className="rounded-full bg-emerald-100 px-2 py-1">
                <Clock className="h-3 w-3 text-emerald-700" />
              </div>
            </div>
          </motion.div>

          {/* Floating Card 2 - Patient */}
          <motion.div 
            style={{ y: y2 }}
            className="absolute -right-6 top-16 w-56 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">New Patient</p>
                <p className="text-xs text-slate-500">Check-in complete</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-600">Token #</span>
              <span className="text-sm font-bold text-slate-900">A-042</span>
            </div>
          </motion.div>

          {/* Floating Card 3 - Analytics */}
          <motion.div 
            style={{ y: y1 }}
            className="absolute left-1/2 -translate-x-1/2 -bottom-16 w-72 rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-900">Weekly Analytics</span>
              </div>
              <span className="text-xs text-emerald-600 font-medium">+24%</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-slate-100 p-2 text-center">
                <p className="text-lg font-bold text-slate-900">142</p>
                <p className="text-[10px] text-slate-500 uppercase">Visits</p>
              </div>
              <div className="flex-1 rounded-lg bg-slate-100 p-2 text-center">
                <p className="text-lg font-bold text-slate-900">$48k</p>
                <p className="text-[10px] text-slate-500 uppercase">Revenue</p>
              </div>
              <div className="flex-1 rounded-lg bg-slate-100 p-2 text-center">
                <p className="text-lg font-bold text-slate-900">4.9</p>
                <p className="text-[10px] text-slate-500 uppercase">Rating</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
