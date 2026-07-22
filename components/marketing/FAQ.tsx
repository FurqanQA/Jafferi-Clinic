"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Reveal } from "@/components/shared/Reveal";

const faqs = [
  {
    question: "Is Jafferi Clinic suitable for small practices?",
    answer: "Yes. The experience is designed to feel elegant and manageable, whether you run a single clinic or a growing network. Our pricing scales with your needs, and you can start with just the essentials.",
  },
  {
    question: "Can I customize the booking journey?",
    answer: "Absolutely. You can tailor appointment types, intake steps, and communication flows to fit your care model. Our flexible workflow engine lets you create patient journeys that match your clinic's unique approach.",
  },
  {
    question: "How quickly can we get started?",
    answer: "Most teams launch their first patient-facing experience in a matter of days with guided onboarding and templates. Our implementation team handles data migration, staff training, and go-live support.",
  },
  {
    question: "Is my patient data secure?",
    answer: "Security is built into every layer. We're HIPAA-compliant with end-to-end encryption, regular security audits, and role-based access controls. Your data is stored in SOC 2 Type II certified data centers.",
  },
  {
    question: "What kind of support do you offer?",
    answer: "We provide 24/7 priority support for all customers, dedicated account managers for enterprise plans, and a comprehensive knowledge base. Our average response time is under 2 hours for critical issues.",
  },
  {
    question: "Can I integrate with existing systems?",
    answer: "Yes. Jafferi Clinic integrates with major EHR systems, billing platforms, insurance providers, and lab networks. Our API-first architecture makes custom integrations straightforward.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section className="bg-gradient-to-b from-slate-50/50 to-white">
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="FAQ"
            title="Questions about the experience?"
            description="Everything is designed to feel clear, flexible, and easy to adopt. Here are answers to common questions."
            className="max-w-3xl mx-auto text-center"
          />
        </Reveal>
        <div className="mt-16 max-w-3xl mx-auto space-y-4">
          <Reveal>
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-6 text-left"
                >
                  <span className="text-lg font-semibold text-slate-900">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 text-base leading-relaxed text-slate-600">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
