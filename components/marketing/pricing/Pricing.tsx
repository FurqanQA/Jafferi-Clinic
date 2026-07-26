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
    <section id="pricing" className="py-20 bg-white sm:py-24 md:py-28">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:px-4 sm:py-2 sm:text-sm">
            Pricing
          </span>

          <h2 className="mt-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Simple & Transparent Pricing
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border p-6 shadow-lg sm:rounded-3xl sm:p-10 ${
                plan.popular
                  ? "border-emerald-500 ring-2 ring-emerald-500"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="mb-4 inline-block rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold sm:text-2xl">{plan.name}</h3>

              <div className="mt-4 text-4xl font-black sm:mt-6 sm:text-5xl">
                {plan.price}
              </div>

              <p className="mt-2 text-muted-foreground sm:mt-3">
                {plan.description}
              </p>

              <div className="my-6 space-y-3 sm:my-8 sm:space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check size={16} className="text-emerald-600 sm:size-[18px]" />
                    <span className="text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full rounded-full text-sm sm:text-base">
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
