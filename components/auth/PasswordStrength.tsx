"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  check: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "At least 8 characters", check: (p) => p.length >= 8 },
  { label: "Uppercase letter", check: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", check: (p) => /[a-z]/.test(p) },
  { label: "Number", check: (p) => /\d/.test(p) },
  { label: "Special character", check: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) {
    return { score: 0, label: "", color: "bg-slate-200" };
  }

  const metRequirements = requirements.filter((req) => req.check(password)).length;
  const score = Math.min((metRequirements / requirements.length) * 100, 100);

  if (score < 20) {
    return { score, label: "Very Weak", color: "bg-red-500" };
  }
  if (score < 40) {
    return { score, label: "Weak", color: "bg-orange-500" };
  }
  if (score < 60) {
    return { score, label: "Medium", color: "bg-yellow-500" };
  }
  if (score < 80) {
    return { score, label: "Strong", color: "bg-emerald-500" };
  }
  return { score, label: "Very Strong", color: "bg-emerald-600" };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label, color } = getPasswordStrength(password);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.3 }}
            className={cn("h-full transition-colors duration-300", color)}
          />
        </div>

        {label && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-medium text-slate-600"
          >
            Password strength: <span className={cn(label === "Very Weak" || label === "Weak" ? "text-orange-600" : "text-emerald-600")}>{label}</span>
          </motion.p>
        )}
      </div>

      <ul className="space-y-2">
        {requirements.map((req, index) => {
          const isMet = req.check(password);

          return (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-xs text-slate-600"
            >
              {isMet ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Circle className="size-4 text-slate-300" />
              )}
              <span className={cn(isMet && "text-emerald-700")}>
                {req.label}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
