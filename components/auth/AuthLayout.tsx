"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-100">

      {/* Background Blur */}

      <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-emerald-300/30 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-green-200/30 blur-[150px]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-10">

        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/20 bg-white/60 shadow-2xl backdrop-blur-xl lg:grid-cols-2">

          {/* Left Side */}

          <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">

            <div>

              <Image
                src="/images/logo.png"
                alt="Jafferi Clinic"
                width={70}
                height={70}
                priority
              />

              <h1 className="mt-8 text-5xl font-bold leading-tight">
                Modern Clinic
                <br />
                Management
              </h1>

              <p className="mt-6 max-w-md text-lg text-emerald-100">
                Simplify appointments, manage patients, track revenue,
                and grow your healthcare practice with one intelligent platform.
              </p>

            </div>

            {/* Dashboard Preview */}

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .7 }}
              className="relative mt-12"
            >
              <Image
                src="/images/dashboard-preview.png"
                alt="Dashboard"
                width={700}
                height={500}
                className="rounded-3xl shadow-2xl"
              />

              <motion.div
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
                className="absolute -left-6 top-6 rounded-2xl bg-white p-5 text-slate-900 shadow-xl"
              >
                <p className="text-sm text-gray-500">
                  Today's Appointments
                </p>

                <h3 className="mt-2 text-3xl font-bold">
                  28
                </h3>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 8, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                }}
                className="absolute -right-6 bottom-10 rounded-2xl bg-white p-5 text-slate-900 shadow-xl"
              >
                <p className="text-sm text-gray-500">
                  Revenue
                </p>

                <h3 className="mt-2 text-3xl font-bold">
                  $18,400
                </h3>
              </motion.div>

            </motion.div>

          </div>

          {/* Right Side */}

          <div className="flex min-h-screen flex-col justify-between bg-white/70 p-8 backdrop-blur-xl sm:p-10 lg:min-h-0 lg:p-14">

            <div>

              <AuthHeader />

              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .4 }}
                className="mt-10"
              >
                {children}
              </motion.div>

            </div>

            <AuthFooter />

          </div>

        </div>

      </div>

    </main>
  );
}