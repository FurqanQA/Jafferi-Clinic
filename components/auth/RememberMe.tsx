"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RememberMeProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
}

export default function RememberMe({
  checked = false,
  onCheckedChange,
  disabled = false,
  name = "rememberMe",
  id = "rememberMe",
}: RememberMeProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer select-none"
    >
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />

        <motion.div
          className={cn(
            "flex size-4 items-center justify-center rounded border transition-colors",
            "border-slate-300 bg-white peer-checked:border-emerald-600 peer-checked:bg-emerald-600",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            className={cn(
              "size-3 text-white transition-opacity",
              checked ? "opacity-100" : "opacity-0"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      </div>

      <span
        className={cn(
          "text-sm text-slate-600 transition-colors",
          disabled && "opacity-50"
        )}
      >
        Remember me
      </span>
    </label>
  );
}
