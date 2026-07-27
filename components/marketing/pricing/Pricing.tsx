"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for small clinics.",
    features: [
      "Appointment Management",
      "Patient Records",
      "Billing",
      "Email Support",
    ],
  },
  {
    name: "Professional",
    price: "$79",
    popular: true,
    description: "Best for growing clinics.",
    features: [
      "Everything in Starter",
      "Analytics Dashboard",
      "Doctor Management",
      "SMS Notifications",
      "Priority Support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For hospitals & large organizations.",
    features: [
      "Unlimited Users",
      "Advanced Reports",
      "API Access",
      "Dedicated Manager",
      "Custom Integrations",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="py-16 bg-white sm:py-20 md:py-24 lg:py-28 xl:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="px-2 text-center sm:px-0">
          <span className="badge-premium">
            Pricing
          </span>

          <h2 id="pricing-heading" className="mt-6 text-3xl font-bold sm:mt-8 sm:text-4xl lg:text-5xl">
            Simple & Transparent Pricing
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:mt-20 lg:gap-8 xl:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              whileHover={{ y: -8, scale: 1.02 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 sm:rounded-3xl sm:p-8 ${
                plan.popular
                  ? "border-emerald-500/80 ring-2 ring-emerald-500/50 bg-emerald-50/30"
                  : "border-border/50 hover:border-border/80"
              }`}
            >
              {plan.popular && (
                <div className="mb-4 inline-block rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-3 py-1.5 text-xs text-white shadow-md sm:mb-6 sm:px-4 sm:py-2 sm:text-sm" role="status">
                  Most Popular
                </div>
              )}

              <h3 className="text-lg font-bold sm:text-xl lg:text-2xl leading-tight">{plan.name}</h3>

              <div className="mt-4 text-3xl font-black sm:mt-6 sm:text-4xl lg:text-5xl tracking-tight">
                {plan.price}
              </div>

              <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base leading-relaxed">
                {plan.description}
              </p>

              <ul className="my-5 space-y-3 sm:my-6 sm:space-y-4" role="list">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check size={16} className="flex-shrink-0 text-emerald-600 sm:size-[18px]" aria-hidden="true" />
                    <span className="text-sm leading-relaxed sm:text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full rounded-full text-sm sm:text-base">
                Get Started
              </Button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
