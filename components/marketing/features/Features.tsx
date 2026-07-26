"use client";

import {
  CalendarCheck,
  Users,
  CreditCard,
  BarChart3,
  ShieldCheck,
  BellRing,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: CalendarCheck,
    title: "Appointment Scheduling",
    description:
      "Book, reschedule and manage appointments with an intuitive calendar.",
  },
  {
    icon: Users,
    title: "Patient Management",
    description:
      "Digital medical records, visit history and treatment tracking.",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description:
      "Generate invoices, accept payments and monitor outstanding balances.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Monitor revenue, appointments and clinic growth with live insights.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    description:
      "Role-based permissions, encrypted data and secure cloud backups.",
  },
  {
    icon: BellRing,
    title: "Smart Notifications",
    description:
      "Automatic reminders through SMS and email reduce missed appointments.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-20 bg-gradient-to-b from-white to-emerald-50/30 sm:py-24 md:py-28"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:px-4 sm:py-2 sm:text-sm">
            Powerful Features
          </span>

          <h2 className="mt-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Everything Your Clinic Needs
          </h2>

          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            From appointment scheduling to billing and analytics,
            Jafferi Clinic helps you run your entire practice from one platform.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -10,
                }}
                className="group rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-2xl sm:rounded-3xl sm:p-8"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl">
                  <Icon size={24} className="sm:size-[30px]" />
                </div>

                <h3 className="mt-6 text-xl font-bold sm:mt-8 sm:text-2xl">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-muted-foreground sm:mt-4">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
