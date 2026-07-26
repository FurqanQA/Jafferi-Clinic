"use client";

import { motion } from "framer-motion";
import {
  Clock3,
  Users,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

const benefits = [
  {
    icon: Clock3,
    title: "Save 10+ Hours Every Week",
    description:
      "Automate appointments, reminders, and administrative tasks to focus more on patient care.",
  },
  {
    icon: Users,
    title: "Better Patient Experience",
    description:
      "Reduce waiting times and provide a seamless experience with digital records and smart scheduling.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Clinic",
    description:
      "Track revenue, appointments, and performance with real-time analytics to make informed decisions.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description:
      "Your clinic data is protected with encrypted storage, secure authentication, and role-based access.",
  },
];

export default function Benefits() {
  return (
    <section className="py-20 bg-white sm:py-24 md:py-28">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:px-4 sm:py-2 sm:text-sm">
              Why Choose Jafferi Clinic
            </span>

            <h2 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Built to Help Clinics
              <span className="text-emerald-600"> Work Smarter</span>
            </h2>

            <p className="mt-6 text-base text-muted-foreground leading-7 sm:text-lg sm:leading-8">
              Jafferi Clinic streamlines every part of your clinic—from patient
              registration and appointments to billing and analytics—allowing
              your staff to focus on delivering exceptional healthcare.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            {benefits.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="rounded-2xl border bg-white p-6 shadow-lg transition-all hover:shadow-2xl sm:rounded-3xl sm:p-8"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl">
                    <Icon size={24} className="sm:size-[28px]" />
                  </div>

                  <h3 className="text-lg font-bold sm:text-xl">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-muted-foreground leading-6 sm:mt-4 sm:leading-7">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
