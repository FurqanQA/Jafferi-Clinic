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
      className="py-28 bg-gradient-to-b from-white to-emerald-50/30"
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Powerful Features
          </span>

          <h2 className="mt-6 text-4xl font-bold lg:text-5xl">
            Everything Your Clinic Needs
          </h2>

          <p className="mt-6 text-lg text-muted-foreground">
            From appointment scheduling to billing and analytics,
            Jafferi Clinic helps you run your entire practice from one platform.
          </p>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                className="group rounded-3xl border bg-white p-8 shadow-sm transition-all hover:shadow-2xl"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                  <Icon size={30} />
                </div>

                <h3 className="mt-8 text-2xl font-bold">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-muted-foreground">
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