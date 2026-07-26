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
    <section id="pricing" className="py-28 bg-white">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Pricing
          </span>

          <h2 className="mt-6 text-5xl font-bold">
            Simple & Transparent Pricing
          </h2>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-3xl border p-10 shadow-lg ${
                plan.popular
                  ? "border-emerald-500 ring-2 ring-emerald-500"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="mb-6 inline-block rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold">{plan.name}</h3>

              <div className="mt-6 text-5xl font-black">
                {plan.price}
              </div>

              <p className="mt-3 text-muted-foreground">
                {plan.description}
              </p>

              <div className="my-8 space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check size={18} className="text-emerald-600" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button className="w-full rounded-full">
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}