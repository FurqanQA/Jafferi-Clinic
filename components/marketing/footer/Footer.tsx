"use client";

import Image from "next/image";
import Link from "next/link";

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

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="grid gap-10 sm:gap-12 lg:gap-14 lg:grid-cols-5">
          {/* Company */}

          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3"
            >
              <Image
                src="/images/Jafferi Clinic.png"
                alt="Jafferi Clinic"
                width={40}
                height={40}
                className="sm:h-[50px] sm:w-[50px]"
              />

              <div>
                <h3 className="text-xl font-bold sm:text-2xl">
                  Jafferi Clinic
                </h3>

                <p className="text-xs text-muted-foreground sm:text-sm">
                  AI Clinic Management Software
                </p>
              </div>
            </Link>

            <p className="mt-6 max-w-md leading-7 text-muted-foreground sm:mt-8 sm:leading-8">
              Modern clinic management software designed to simplify
              appointments, patient records, billing and analytics for
              healthcare professionals worldwide.
            </p>

            <div className="mt-6 space-y-3 text-muted-foreground sm:mt-8 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Mail className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">hello@jaffericlinic.com</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Phone className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">+92 300 1234567</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Karachi, Pakistan</span>
              </div>
            </div>
          </div>

          {/* Links */}

          <div>
            <h4 className="mb-4 font-bold sm:mb-6">
              Company
            </h4>

            <div className="space-y-3 sm:space-y-4">
              {company.map((item) => (
                <Link
                  key={item}
                  href="/"
                  className="block text-muted-foreground transition hover:text-emerald-600 text-sm sm:text-base"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold sm:mb-6">
              Product
            </h4>

            <div className="space-y-3 sm:space-y-4">
              {product.map((item) => (
                <Link
                  key={item}
                  href="/"
                  className="block text-muted-foreground transition hover:text-emerald-600 text-sm sm:text-base"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold sm:mb-6">
              Resources
            </h4>

            <div className="space-y-3 sm:space-y-4">
              {resources.map((item) => (
                <Link
                  key={item}
                  href="/"
                  className="block text-muted-foreground transition hover:text-emerald-600 text-sm sm:text-base"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:mt-12 sm:gap-6 lg:flex-row lg:mt-16 lg:pt-10">
          <p className="text-center text-sm text-muted-foreground sm:text-base">
            {new Date().getFullYear()} Jafferi Clinic. All rights
            reserved.
          </p>

          <div className="flex gap-4 sm:gap-5">
            <Link href="/" aria-label="Facebook">
              <FaFacebook className="h-4 w-4 transition hover:text-emerald-600 sm:h-5 sm:w-5" />
            </Link>

            <Link href="/" aria-label="Twitter">
              <FaXTwitter className="h-4 w-4 transition hover:text-emerald-600 sm:h-5 sm:w-5" />
            </Link>

            <Link href="/" aria-label="Instagram">
              <FaInstagram className="h-4 w-4 transition hover:text-emerald-600 sm:h-5 sm:w-5" />
            </Link>

            <Link href="/" aria-label="LinkedIn">
              <FaLinkedin className="h-4 w-4 transition hover:text-emerald-600 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
