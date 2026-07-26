"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    <section id="faq" className="bg-gray-50 py-20 sm:py-24 md:py-28">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:px-4 sm:py-2 sm:text-sm">
            FAQ
          </span>

          <h2 className="mt-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion className="mt-8 w-full sm:mt-12">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="mb-4 rounded-xl border bg-white px-4 sm:mb-6 sm:rounded-2xl sm:px-6"
            >
              <AccordionTrigger className="text-left text-base font-semibold sm:text-lg">
                {faq.question}
              </AccordionTrigger>

              <AccordionContent className="text-muted-foreground leading-6 sm:leading-7">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
