"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "Can I manage multiple doctors?",
    answer:
      "Yes. Jafferi Clinic supports multiple doctors, departments, and schedules.",
  },
  {
    question: "Does it include billing?",
    answer:
      "Yes. Generate invoices, track payments, discounts, and financial reports.",
  },
  {
    question: "Can patients receive reminders?",
    answer:
      "Yes. Automatic SMS and email reminders help reduce missed appointments.",
  },
  {
    question: "Is my clinic data secure?",
    answer:
      "Absolutely. All data is encrypted and protected with role-based access control.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="bg-gray-50 py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="px-2 text-center sm:px-0">
          <span className="badge-premium">
            FAQ
          </span>

          <h2 id="faq-heading" className="mt-6 text-3xl font-bold sm:mt-8 sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion className="mt-8 w-full sm:mt-12">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <AccordionItem
                value={`item-${index}`}
                className="mb-4 rounded-xl border border-border/50 bg-white px-4 sm:mb-6 sm:rounded-2xl sm:px-6"
              >
                <AccordionTrigger className="text-left text-base font-semibold sm:text-lg">
                  {faq.question}
                </AccordionTrigger>

                <AccordionContent className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
