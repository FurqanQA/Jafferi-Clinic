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
    <section className="py-28 bg-white">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              Why Choose Jafferi Clinic
            </span>

            <h2 className="mt-6 text-4xl lg:text-5xl font-bold leading-tight">
              Built to Help Clinics
              <span className="text-emerald-600"> Work Smarter</span>
            </h2>

            <p className="mt-6 text-lg text-muted-foreground leading-8">
              Jafferi Clinic streamlines every part of your clinic—from patient
              registration and appointments to billing and analytics—allowing
              your staff to focus on delivering exceptional healthcare.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
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
                  className="rounded-3xl border bg-white p-8 shadow-lg transition-all hover:shadow-2xl"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                    <Icon size={28} />
                  </div>

                  <h3 className="text-xl font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-muted-foreground leading-7">
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