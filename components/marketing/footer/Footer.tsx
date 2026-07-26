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
      <div className="container mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-14 lg:grid-cols-5">
          {/* Company */}

          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <Image
                src="/images/Jafferi Clinic.png"
                alt="Jafferi Clinic"
                width={50}
                height={50}
              />

              <div>
                <h3 className="text-2xl font-bold">
                  Jafferi Clinic
                </h3>

                <p className="text-sm text-muted-foreground">
                  AI Clinic Management Software
                </p>
              </div>
            </Link>

            <p className="mt-8 max-w-md leading-8 text-muted-foreground">
              Modern clinic management software designed to simplify
              appointments, patient records, billing and analytics for
              healthcare professionals worldwide.
            </p>

            <div className="mt-8 space-y-4 text-muted-foreground">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-600" />
                hello@jaffericlinic.com
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-600" />
                +92 300 1234567
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Karachi, Pakistan
              </div>
            </div>
          </div>

          {/* Links */}

          <div>
            <h4 className="mb-6 font-bold">
              Company
            </h4>

            <div className="space-y-4">
              {company.map((item) => (
                <Link
                  key={item}
                  href="/"
                  className="block text-muted-foreground transition hover:text-emerald-600"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-bold">
              Product
            </h4>

            <div className="space-y-4">
              {product.map((item) => (
                <Link
                  key={item}
                  href="/"
                  className="block text-muted-foreground transition hover:text-emerald-600"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-bold">
              Resources
            </h4>

            <div className="space-y-4">
              {resources.map((item) => (
                <Link
                  key={item}
                  href="/"
                  className="block text-muted-foreground transition hover:text-emerald-600"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t pt-10 lg:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Jafferi Clinic. All rights
            reserved.
          </p>

          <div className="flex gap-5">
            <Link href="/">
              <FaFacebook className="h-5 w-5 transition hover:text-emerald-600" />
            </Link>

            <Link href="/">
              <FaXTwitter className="h-5 w-5 transition hover:text-emerald-600" />
            </Link>

            <Link href="/">
              <FaInstagram className="h-5 w-5 transition hover:text-emerald-600" />
            </Link>

            <Link href="/">
              <FaLinkedin className="h-5 w-5 transition hover:text-emerald-600" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}