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
    <section id="faq" className="bg-gray-50 py-28">
      <div className="container mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            FAQ
          </span>

          <h2 className="mt-6 text-5xl font-bold">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="rounded-2xl border bg-white px-6"
            >
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>

              <AccordionContent className="text-muted-foreground leading-7">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}