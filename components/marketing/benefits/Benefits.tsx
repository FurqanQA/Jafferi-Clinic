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
    <section aria-labelledby="benefits-heading" className="py-16 bg-white sm:py-20 md:py-24 lg:py-28 xl:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center sm:gap-12">
          <div>
            <span className="badge-premium">
              Why Choose Jafferi Clinic
            </span>

            <h2 id="benefits-heading" className="mt-5 text-3xl font-bold leading-tight sm:mt-6 sm:text-4xl lg:text-5xl">
              Built to Help Clinics
              <span className="text-emerald-600"> Work Smarter</span>
            </h2>

            <p className="mt-4 text-base text-muted-foreground leading-7 sm:mt-6 sm:text-lg sm:leading-8">
              Jafferi Clinic streamlines every part of your clinic—from patient
              registration and appointments to billing and analytics—allowing
              your staff to focus on delivering exceptional healthcare.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            {benefits.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:border-border/80 sm:rounded-3xl sm:p-8"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/90 to-green-600/90 text-white shadow-md sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl" aria-hidden="true">
                    <Icon size={20} className="sm:size-[24px]" />
                  </div>

                  <h3 className="text-base font-bold sm:text-lg lg:text-xl leading-tight">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:leading-7">
                    {item.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
