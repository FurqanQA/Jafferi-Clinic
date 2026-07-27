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
      aria-labelledby="features-heading"
      className="py-16 bg-gradient-to-b from-white to-emerald-50/40 sm:py-20 md:py-24 lg:py-28 xl:py-32"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl px-2 text-center sm:px-0">
          <span className="badge-premium">
            Powerful Features
          </span>

          <h2 id="features-heading" className="mt-6 text-3xl font-bold sm:mt-8 sm:text-4xl lg:text-5xl">
            Everything Your Clinic Needs
          </h2>

          <p className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg sm:leading-relaxed">
            From appointment scheduling to billing and analytics,
            Jafferi Clinic helps you run your entire practice from one platform.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:mt-20 lg:gap-8 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
                className="group rounded-2xl border border-border/50 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:border-border/80 sm:rounded-3xl sm:p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/90 to-green-600/90 text-white shadow-md sm:h-14 sm:w-14 sm:rounded-2xl" aria-hidden="true">
                  <Icon size={20} className="sm:size-[24px]" />
                </div>

                <h3 className="mt-5 text-lg font-bold sm:mt-6 sm:text-xl lg:text-2xl leading-tight">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:leading-7">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
