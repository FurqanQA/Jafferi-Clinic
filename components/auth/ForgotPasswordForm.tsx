"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validation/forgot-password";
import { forgotPassword } from "@/services/auth/forgot-password";

export default function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await forgotPassword({ email: data.email });

      if (result.success) {
        toast.success("Password reset link sent to your email.");
        setIsSuccess(true);
      } else {
        const errorMessage = result.error?.message || "Failed to send password reset email. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 0.3,
      }}
      className="w-full max-w-md"
    >
      <div className="rounded-2xl border border-white/20 bg-white/60 p-8 shadow-xl backdrop-blur-xl sm:p-10">
        {isSuccess ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
            }}
            className="text-center"
          >
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Check your email
            </h1>

            <p className="mt-2 text-slate-500">
              We have sent a password reset link to your email address.
            </p>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background shadow-sm hover:shadow-md hover:bg-muted hover:text-foreground hover:-translate-y-0.5 transition-all duration-300 ease-out h-10 w-full text-base font-medium focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Login
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <Image
                src="/images/Jafferi Clinic.png"
                alt="Jafferi Clinic"
                width={64}
                height={64}
                priority
                className="h-16 w-16"
              />
              <h1 className="mt-4 text-3xl font-bold text-slate-900">
                Forgot Password?
              </h1>
            </div>

            <p className="mt-2 text-slate-500">
              Enter your email and we'll send you a password reset link.
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-8 space-y-6"
              noValidate
            >
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>

                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />

                {errors.email && (
                  <p
                    id="email-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 text-base"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                <ArrowLeft className="mr-1 size-4" />
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
