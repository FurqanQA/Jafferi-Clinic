"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 z-50 w-full"
        role="banner"
      >
        <div className="mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-2xl border border-border/50 bg-white/80 px-3 py-2.5 shadow-lg backdrop-blur-xl sm:mt-4 sm:px-4 sm:py-3 md:mt-5 md:px-6 md:py-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/images/Jafferi Clinic.png"
              alt="Jafferi Clinic"
              width={32}
              height={32}
              priority
              className="h-8 w-8 sm:h-[42px] sm:w-[42px]"
            />

            <div className="hidden sm:block">
              <h2 className="font-bold text-sm sm:text-base lg:text-lg">Jafferi Clinic</h2>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                Clinic Management
              </p>
            </div>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-4 lg:gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="whitespace-nowrap text-xs font-medium transition hover:text-emerald-600 sm:text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:gap-3 md:flex">
            <Link href="/login">
              <Button variant="ghost" className="text-xs sm:text-sm">
                Login
              </Button>
            </Link>

            <Link href="/register">
              <Button className="rounded-full bg-emerald-600 px-3 text-xs hover:bg-emerald-700 sm:px-4 sm:text-sm">
                Book Demo
              </Button>
            </Link>
          </div>

          <button
            onClick={toggleMenu}
            className="rounded-lg border border-border/50 p-2 md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile menu"
            >
              <div className="flex items-center justify-between border-b border-border/50 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Image
                    src="/images/Jafferi Clinic.png"
                    alt="Jafferi Clinic"
                    width={32}
                    height={32}
                    className="h-8 w-8 sm:h-[42px] sm:w-[42px]"
                  />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base lg:text-lg">
                      Jafferi Clinic
                    </h3>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                      Clinic Management
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeMenu}
                  className="rounded-lg border p-2"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Mobile navigation" className="flex flex-col gap-4 p-6 sm:gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className="text-base font-medium text-slate-700 transition hover:text-emerald-600 sm:text-lg"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="mt-6 space-y-3 sm:space-y-4">
                  <Link href="/login" onClick={closeMenu}>
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                    >
                      Login
                    </Button>
                  </Link>

                  <Link href="/register" onClick={closeMenu}>
                    <Button
                      className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      Book Demo
                    </Button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default memo(Navbar);
