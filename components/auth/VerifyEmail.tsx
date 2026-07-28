"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { verifyEmail, resendVerificationEmail } from "@/services/auth/verify-email";

const COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    setIsChecking(true);
    try {
      const result = await verifyEmail();

      if (result.success && result.status === 'verified') {
        toast.success("Email verified successfully!");
        router.push("/dashboard");
      }
    } catch (error) {
      // Silent fail on initial check - user can manually check
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setMessage(null);

    try {
      const result = await resendVerificationEmail();

      if (result.success) {
        setMessage({
          type: "success",
          text: "Verification email sent successfully.",
        });
        toast.success("Verification email sent successfully.");
        setCooldown(COOLDOWN_SECONDS);
      } else {
        const errorMessage = result.error?.message || "Unable to send verification email. Please try again later.";
        setMessage({
          type: "error",
          text: errorMessage,
        });
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = "Unable to send verification email. Please try again later.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleOpenEmailApp = () => {
    window.location.href = "mailto:";
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
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{
            type: "spring",
            duration: 0.6,
            delay: 0.1,
          }}
          className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-100"
        >
          <Mail className="size-10 text-emerald-600" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center text-3xl font-bold text-slate-900"
        >
          Verify Your Email
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-center text-slate-500"
        >
          We've sent a verification email to your inbox.
          <br />
          Please click the verification link before signing in.
        </motion.p>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-destructive/10 text-destructive"
            }`}
            role="alert"
          >
            {message.text}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-3"
        >
          <Button
            onClick={handleOpenEmailApp}
            className="w-full h-10 text-base"
            size="lg"
          >
            Open Email App
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={checkVerificationStatus}
            disabled={isChecking}
            className="w-full h-10 text-base"
            size="lg"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Checking...
              </>
            ) : (
              "I've Verified My Email"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleResendEmail}
            disabled={isResending || cooldown > 0}
            className="w-full h-10 text-base"
            size="lg"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw className="mr-2 size-4" />
                Resend in {cooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 size-4" />
                Resend Verification Email
              </>
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            <ArrowLeft className="mr-1 size-4" />
            Back to Login
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
