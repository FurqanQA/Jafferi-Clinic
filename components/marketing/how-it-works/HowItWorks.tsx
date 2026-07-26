"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create Your Clinic",
    description:
      "Set up your clinic profile, doctors, departments, and working hours in minutes.",
  },
  {
    number: "02",
    title: "Manage Patients",
    description:
      "Store patient records, prescriptions, medical history, and appointments digitally.",
  },
  {
    number: "03",
    title: "Grow Your Practice",
    description:
      "Track analytics, automate reminders, monitor revenue, and deliver a better patient experience.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50 sm:py-24 md:py-28">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:px-4 sm:py-2 sm:text-sm">
            How It Works
          </span>

          <h2 className="mt-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Get Started in Three Simple Steps
          </h2>

          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            Launch your clinic management system quickly without complicated setup.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:mt-16 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative rounded-2xl bg-white p-8 shadow-lg sm:rounded-3xl sm:p-10"
            >
              <div className="absolute -top-5 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white shadow-lg sm:-top-6 sm:left-10 sm:h-14 sm:w-14 sm:text-xl">
                {step.number}
              </div>

              <div className="pt-6 sm:pt-8">
                <h3 className="text-xl font-bold sm:text-2xl">
                  {step.title}
                </h3>

                <p className="mt-4 leading-7 text-muted-foreground sm:mt-5 sm:leading-8">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
