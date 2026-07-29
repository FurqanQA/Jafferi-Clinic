"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./PasswordInput";
import PasswordStrength from "./PasswordStrength";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validation/reset-password";
import { resetPassword } from "@/services/auth/reset-password";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await resetPassword({ newPassword: data.password });

      if (result.success) {
        toast.success("Password updated successfully!");
        setIsSuccess(true);
      } else {
        const errorMessage = result.error?.message || "Failed to reset password. Please try again.";
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
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              transition={{
                duration: 0.3,
              }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  duration: 0.5,
                  delay: 0.1,
                }}
                className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-100"
              >
                <CheckCircle2 className="size-10 text-emerald-600" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-slate-900"
              >
                Password updated successfully
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-slate-500"
              >
                Your password has been changed. You can now sign in with your new password.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300 ease-out h-10 w-full text-base font-medium focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                >
                  Continue to Login
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              transition={{
                duration: 0.3,
              }}
            >
              <div className="mb-8">
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
                    Reset Password
                  </h1>
                </div>

                <p className="mt-2 text-slate-500">
                  Create a new secure password for your account
                </p>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                <div className="space-y-2">
                  <PasswordInput
                    id="password"
                    label="New Password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    error={errors.password?.message}
                    required
                    {...register("password")}
                  />

                  {password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2"
                    >
                      <PasswordStrength password={password} />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <PasswordInput
                    id="confirmPassword"
                    label="Confirm Password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    error={errors.confirmPassword?.message}
                    required
                    {...register("confirmPassword")}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
