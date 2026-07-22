"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, BadgeCheck, Calendar, Clock, DollarSign, HeartPulse, ShieldCheck, Sparkles, TrendingUp, User, Activity, CheckCircle2, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { MarketingBadge } from "@/components/shared/Badge";

const trustItems = ["HIPAA Ready", "Cloud Based", "99.9% Uptime", "SOC 2 Compliant"];

export function Hero() {
  const { scrollY } = useScroll();
  const y1 = useSpring(useTransform(scrollY, [0, 500], [0, 150]), { stiffness: 100, damping: 30 });
  const y2 = useSpring(useTransform(scrollY, [0, 500], [0, -100]), { stiffness: 100, damping: 30 });
  const rotate = useSpring(useTransform(scrollY, [0, 500], [0, 5]), { stiffness: 100, damping: 30 });
  const scale = useSpring(useTransform(scrollY, [0, 500], [1, 0.98]), { stiffness: 100, damping: 30 });

  return (
    <section className="relative overflow-hidden px-6 py-32 sm:px-8 lg:px-8 lg:py-40">
      {/* Premium gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-slate-50" />
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(37,99,235,0.08),_transparent_50%)]" />
      </div>

      <Container className="grid items-center gap-20 lg:grid-cols-[1fr_1.1fr]">
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <MarketingBadge className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/25 border-0">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Healthcare Operating System
            </MarketingBadge>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-7xl lg:text-8xl leading-[1.05]"
          >
            The future of
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              healthcare.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 max-w-xl text-xl leading-relaxed text-slate-600"
          >
            Jafferi Clinic transforms healthcare operations into a premium experience. Appointments, billing, communications, and patient journeys—orchestrated with calm precision.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 flex flex-col gap-4 sm:flex-row"
          >
            <Link href="/book-appointment">
              <Button className="h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-8 text-sm font-semibold text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 border-0">
                Book Appointment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="h-14 rounded-full border-slate-300 px-8 text-sm font-semibold text-slate-700 bg-white/90 backdrop-blur-sm hover:bg-slate-50 hover:border-slate-400 hover:scale-105 transition-all duration-300 shadow-lg shadow-slate-200/50">
                Request Demo
              </Button>
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 flex flex-wrap gap-3"
          >
            {trustItems.map((item, index) => (
              <motion.div 
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-lg shadow-slate-200/50 backdrop-blur-sm"
              >
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> {item}
              </motion.div>
            ))}
          </motion.div>

          {/* Statistics */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 grid grid-cols-3 gap-8 pt-8 border-t border-slate-200/60"
          >
            <div>
              <p className="text-4xl font-bold text-slate-900 tracking-tight">28+</p>
              <p className="mt-2 text-sm font-medium text-slate-600">Active Clinics</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900 tracking-tight">12k+</p>
              <p className="mt-2 text-sm font-medium text-slate-600">Daily Users</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900 tracking-tight">99.9%</p>
              <p className="mt-2 text-sm font-medium text-slate-600">Uptime SLA</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          style={{ y: y1, scale }}
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-blue-500/30 via-cyan-400/20 to-emerald-400/20 blur-3xl" />
          
          {/* Main Dashboard */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/80 p-6 shadow-[0_60px_180px_-60px_rgba(15,23,42,0.5)] backdrop-blur-2xl">
            <div className="rounded-[2rem] border border-slate-200/50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/90 shadow-lg shadow-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/90 shadow-lg shadow-yellow-500/50" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/90 shadow-lg shadow-emerald-500/50" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200">Jafferi Clinic Dashboard</span>
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300 border border-emerald-500/30"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  Live
                </motion.div>
              </div>
              
              {/* Stats Grid */}
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 text-slate-400">
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm font-medium">Appointments</span>
                  </div>
                  <p className="mt-4 text-5xl font-bold tracking-tight">28</p>
                  <p className="mt-2 text-sm text-emerald-400 font-medium">+12% from yesterday</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 text-slate-400">
                    <DollarSign className="h-5 w-5" />
                    <span className="text-sm font-medium">Revenue</span>
                  </div>
                  <p className="mt-4 text-5xl font-bold tracking-tight">$19.2k</p>
                  <p className="mt-2 text-sm text-emerald-400 font-medium">+8% from yesterday</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 text-slate-400">
                    <Activity className="h-5 w-5" />
                    <span className="text-sm font-medium">Patients</span>
                  </div>
                  <p className="mt-4 text-5xl font-bold tracking-tight">142</p>
                  <p className="mt-2 text-sm text-emerald-400 font-medium">+24% this week</p>
                </motion.div>
              </div>

              {/* AI Feature Banner */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-cyan-500/15 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="rounded-xl bg-cyan-500/20 p-3"
                  >
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-cyan-100">AI Scheduling Active</p>
                    <p className="text-sm text-slate-400 mt-1">Reduced no-shows by 34% this week</p>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-semibold">Optimized</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Floating Card 1 - Doctor */}
          <motion.div 
            style={{ y: y2, rotate }}
            className="absolute -left-12 bottom-16 w-72 rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg">
                  <User className="h-6 w-6" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-3 border-white shadow-lg"
                />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-slate-900">Dr. Sarah Chen</p>
                <p className="text-sm text-slate-500">Cardiology</p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1.5">
                <Clock className="h-4 w-4 text-emerald-700" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">Status</span>
              <span className="text-sm font-bold text-emerald-600">Available</span>
            </div>
          </motion.div>

          {/* Floating Card 2 - Patient */}
          <motion.div 
            style={{ y: y2 }}
            className="absolute -right-8 top-20 w-64 rounded-2xl border border-slate-200/60 bg-white/85 p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">New Patient</p>
                <p className="text-xs text-slate-500">Check-in complete</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 border border-blue-100">
              <span className="text-sm text-slate-600 font-medium">Token #</span>
              <span className="text-lg font-bold text-blue-600">A-042</span>
            </div>
          </motion.div>

          {/* Floating Card 3 - Analytics */}
          <motion.div 
            style={{ y: y1 }}
            className="absolute left-1/2 -translate-x-1/2 -bottom-20 w-80 rounded-2xl border border-slate-200/60 bg-white/95 p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-slate-700" />
                <span className="text-sm font-semibold text-slate-900">Weekly Performance</span>
              </div>
              <motion.span 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-sm text-emerald-600 font-bold"
              >
                +24%
              </motion.span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-3 text-center border border-slate-200">
                <p className="text-2xl font-bold text-slate-900">142</p>
                <p className="text-[10px] text-slate-500 uppercase font-medium mt-1">Visits</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-3 text-center border border-slate-200">
                <p className="text-2xl font-bold text-slate-900">$48k</p>
                <p className="text-[10px] text-slate-500 uppercase font-medium mt-1">Revenue</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-3 text-center border border-slate-200">
                <p className="text-2xl font-bold text-slate-900">4.9</p>
                <p className="text-[10px] text-slate-500 uppercase font-medium mt-1">Rating</p>
              </div>
            </div>
          </motion.div>

          {/* Floating Card 4 - Global */}
          <motion.div 
            style={{ y: y2 }}
            className="absolute left-8 top-32 w-56 rounded-2xl border border-slate-200/60 bg-white/85 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Multi-Location</p>
                <p className="text-xs text-slate-500">28 clinics synced</p>
              </div>
            </div>
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-3 flex items-center gap-2 text-blue-600"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Real-time sync</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
