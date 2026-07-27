"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";

import { Mail, Phone, MapPin } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const company = [
  "About",
  "Careers",
  "Contact",
  "Blog",
];

const product = [
  "Features",
  "Pricing",
  "Security",
  "Integrations",
];

const resources = [
  "Help Center",
  "Documentation",
  "Privacy",
  "Terms",
];

function Footer() {
  return (
    <footer role="contentinfo" className="border-t bg-white">
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:py-16 lg:py-20">
        <div className="grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-5">
          {/* Company */}

          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3"
              aria-label="Jafferi Clinic home"
            >
              <Image
                src="/images/Jafferi Clinic.png"
                alt="Jafferi Clinic"
                width={36}
                height={36}
                loading="lazy"
                className="h-9 w-9 sm:h-[50px] sm:w-[50px]"
              />

              <div>
                <h3 className="text-lg font-bold sm:text-xl lg:text-2xl">
                  Jafferi Clinic
                </h3>

                <p className="text-xs text-muted-foreground sm:text-sm">
                  AI Clinic Management Software
                </p>
              </div>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:mt-6 sm:leading-7 sm:text-base">
              Modern clinic management software designed to simplify
              appointments, patient records, billing and analytics for
              healthcare professionals worldwide.
            </p>

            <div className="mt-4 space-y-3 text-muted-foreground sm:mt-6 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Mail className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="text-xs sm:text-sm sm:text-base">
                  <a href="mailto:hello@jaffericlinic.com" className="hover:text-emerald-600 transition">hello@jaffericlinic.com</a>
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Phone className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="text-xs sm:text-sm sm:text-base">
                  <a href="tel:+923001234567" className="hover:text-emerald-600 transition">+92 300 1234567</a>
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" aria-hidden="true" />
                <address className="text-xs sm:text-sm sm:text-base not-italic">
                  Karachi, Pakistan
                </address>
              </div>
            </div>
          </div>

          {/* Links */}

          <nav aria-label="Company links">
            <h4 className="mb-3 font-bold sm:mb-4 sm:mb-6">
              Company
            </h4>

            <ul className="space-y-2 sm:space-y-3 sm:space-y-4">
              {company.map((item) => (
                <li key={item}>
                  <Link
                    href="/"
                    className="block text-xs text-muted-foreground transition hover:text-emerald-600 sm:text-sm sm:text-base"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Product links">
            <h4 className="mb-3 font-bold sm:mb-4 sm:mb-6">
              Product
            </h4>

            <ul className="space-y-2 sm:space-y-3 sm:space-y-4">
              {product.map((item) => (
                <li key={item}>
                  <Link
                    href="/"
                    className="block text-xs text-muted-foreground transition hover:text-emerald-600 sm:text-sm sm:text-base"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources links">
            <h4 className="mb-3 font-bold sm:mb-4 sm:mb-6">
              Resources
            </h4>

            <ul className="space-y-2 sm:space-y-3 sm:space-y-4">
              {resources.map((item) => (
                <li key={item}>
                  <Link
                    href="/"
                    className="block text-xs text-muted-foreground transition hover:text-emerald-600 sm:text-sm sm:text-base"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom */}

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:mt-10 sm:gap-6 sm:pt-8 lg:flex-row lg:mt-12 lg:pt-10">
          <p className="text-center text-xs text-muted-foreground sm:text-sm sm:text-base">
            {new Date().getFullYear()} Jafferi Clinic. All rights
            reserved.
          </p>

          <nav aria-label="Social media links" className="flex gap-3 sm:gap-4 sm:gap-5">
            <Link href="/" aria-label="Facebook">
              <FaFacebook className="h-4 w-4 transition hover:text-emerald-600 sm:h-5 sm:w-5" aria-hidden="true" />
            </Link>

            <Link href="/" aria-label="Twitter">
              <FaXTwitter className="h-4 w-4 transition hover:text-emerald-600 sm:h-5 sm:w-5" aria-hidden="true" />
            </Link>

            <Link href="/" aria-label="Instagram">
              <FaInstagram className="h-4 w-4 transition hover:text-emerald-600 sm:h-5 sm:w-5" aria-hidden="true" />
            </Link>

            <Link href="/" aria-label="LinkedIn">
              <FaLinkedin className="h-4 w-4 transition hover:text-emerald-600 sm:h-5 sm:w-5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
