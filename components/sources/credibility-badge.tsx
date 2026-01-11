"use client";

import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredibilityBadgeProps {
  score: number;
  size?: "sm" | "md";
  className?: string;
}

function getCredibilityConfig(score: number) {
  if (score >= 8) {
    return {
      icon: ShieldCheck,
      label: "Highly Credible",
      color: "text-success-dark",
      bg: "bg-success-light",
    };
  }
  if (score >= 5) {
    return {
      icon: Shield,
      label: "Moderately Credible",
      color: "text-warning-dark",
      bg: "bg-warning-light",
    };
  }
  return {
    icon: ShieldAlert,
    label: "Lower Credibility",
    color: "text-error-dark",
    bg: "bg-error-light",
  };
}

export function CredibilityBadge({
  score,
  size = "md",
  className,
}: CredibilityBadgeProps) {
  const config = getCredibilityConfig(score);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium font-ui",
        config.bg,
        config.color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
      title={`${config.label}: ${score}/10`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      <span>{score}/10</span>
    </span>
  );
}
