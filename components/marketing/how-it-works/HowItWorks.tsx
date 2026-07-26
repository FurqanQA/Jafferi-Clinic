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
    <section className="py-28 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            How It Works
          </span>

          <h2 className="mt-6 text-4xl lg:text-5xl font-bold">
            Get Started in Three Simple Steps
          </h2>

          <p className="mt-6 text-lg text-muted-foreground">
            Launch your clinic management system quickly without complicated setup.
          </p>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative rounded-3xl bg-white p-10 shadow-lg"
            >
              <div className="absolute -top-6 left-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white shadow-lg">
                {step.number}
              </div>

              <div className="pt-8">
                <h3 className="text-2xl font-bold">
                  {step.title}
                </h3>

                <p className="mt-5 leading-8 text-muted-foreground">
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