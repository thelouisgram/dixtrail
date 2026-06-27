"use client";

import { Check, LogIn } from "lucide-react";
import { BouncingDots } from "@/components/ui/cute-placeholder";
import { cn } from "@/lib/utils";

export type SignInStatus = "idle" | "loading" | "success";

interface SignInButtonProps {
  status: SignInStatus;
  shake?: boolean;
  disabled?: boolean;
}

const LABELS: Record<SignInStatus, string> = {
  idle: "Sign in",
  loading: "Signing in…",
  success: "Welcome back!",
};

export function SignInButton({ status, shake = false, disabled = false }: SignInButtonProps) {
  const isBusy = status !== "idle";

  return (
    <button
      type="submit"
      disabled={disabled || isBusy}
      aria-busy={isBusy}
      aria-live="polite"
      className={cn(
        "relative inline-flex h-10 w-full cursor-pointer items-center justify-center overflow-hidden rounded-md text-sm font-medium transition-all duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100",
        status === "success"
          ? "bg-emerald-600 text-white shadow-sm"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        shake && "animate-gentle-shake"
      )}
    >
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300",
          status === "idle"
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        )}
      >
        <LogIn className="h-4 w-4" aria-hidden />
        {LABELS.idle}
      </span>

      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2.5 transition-all duration-300",
          status === "loading"
            ? "translate-y-0 opacity-100"
            : status === "idle"
              ? "translate-y-full opacity-0"
              : "-translate-y-full opacity-0"
        )}
      >
        <BouncingDots inverted />
        <span className="animate-gentle-pulse">{LABELS.loading}</span>
      </span>

      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300",
          status === "success"
            ? "translate-y-0 opacity-100 animate-scale-pop"
            : "translate-y-full opacity-0"
        )}
      >
        <Check className="h-4 w-4" aria-hidden />
        {LABELS.success}
      </span>

      <span className="invisible flex items-center gap-2 px-4">
        <LogIn className="h-4 w-4" />
        {LABELS.loading}
      </span>
    </button>
  );
}
