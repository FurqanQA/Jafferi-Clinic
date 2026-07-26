"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 z-50 w-full"
    >
      <div className="mx-auto mt-5 flex max-w-7xl items-center justify-between rounded-2xl border bg-white/80 px-6 py-4 shadow-lg backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/Jafferi Clinic.png"
            alt="Jafferi Clinic"
            width={42}
            height={42}
          />

          <div>
            <h2 className="font-bold text-lg">Jafferi Clinic</h2>
            <p className="text-xs text-muted-foreground">
              Clinic Management
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium transition hover:text-emerald-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden gap-3 md:flex">
          <Button variant="ghost">Login</Button>

          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700">
            Book Demo
          </Button>
        </div>

        <button className="md:hidden">
          <Menu />
        </button>
      </div>
    </motion.header>
  );
}