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
    <section aria-labelledby="how-it-works-heading" className="py-16 bg-gray-50 sm:py-20 md:py-24 lg:py-28 xl:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl px-2 text-center sm:px-0">
          <span className="badge-premium">
            How It Works
          </span>

          <h2 id="how-it-works-heading" className="mt-6 text-3xl font-bold sm:mt-8 sm:text-4xl lg:text-5xl">
            Get Started in Three Simple Steps
          </h2>

          <p className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg">
            Launch your clinic management system quickly without complicated setup.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative rounded-2xl border border-border/50 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:border-border/80 sm:rounded-3xl sm:p-10"
            >
              <div className="absolute -top-4 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white shadow-lg sm:-top-5 sm:left-8 sm:h-14 sm:w-14 sm:text-xl">
                {step.number}
              </div>

              <div className="pt-6 sm:pt-8">
                <h3 className="text-lg font-bold sm:text-xl lg:text-2xl leading-tight">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:leading-7 sm:text-base">
                  {step.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
