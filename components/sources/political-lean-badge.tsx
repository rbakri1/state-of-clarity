"use client";

import type { PoliticalLean } from "@/lib/types/brief";
import { cn } from "@/lib/utils";

interface PoliticalLeanBadgeProps {
  lean: PoliticalLean;
  size?: "sm" | "md";
  className?: string;
}

const LEAN_CONFIG: Record<
  PoliticalLean,
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  left: {
    label: "Left",
    color: "text-[#8B4840]",
    bg: "bg-[#F5EBE9]",
  },
  "center-left": {
    label: "Center-Left",
    color: "text-[#9A6F6F]",
    bg: "bg-[#F5ECEC]",
  },
  center: {
    label: "Center",
    color: "text-ink-600",
    bg: "bg-ivory-200",
  },
  "center-right": {
    label: "Center-Right",
    color: "text-[#4D6672]",
    bg: "bg-[#EBF1F4]",
  },
  right: {
    label: "Right",
    color: "text-[#3D5C72]",
    bg: "bg-[#E8F0F4]",
  },
  unknown: {
    label: "Unknown",
    color: "text-ink-500",
    bg: "bg-ivory-300",
  },
};

export function PoliticalLeanBadge({
  lean,
  size = "md",
  className,
}: PoliticalLeanBadgeProps) {
  const config = LEAN_CONFIG[lean];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium font-ui",
        config.bg,
        config.color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
      title={`Political lean: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
