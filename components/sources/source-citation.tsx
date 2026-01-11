"use client";

import type { Source, PoliticalLean } from "@/lib/types/brief";
import { cn } from "@/lib/utils";

interface SourceCitationProps {
  source: Source;
  citationNumber: number;
  className?: string;
}

const LEAN_COLORS: Record<PoliticalLean, string> = {
  left: "text-[#C85C6B]",
  "center-left": "text-[#D9A0A0]",
  center: "text-ink-400",
  "center-right": "text-[#7FA5B8]",
  right: "text-[#6B8FB3]",
  unknown: "text-ivory-600",
};

export function SourceCitation({
  source,
  citationNumber,
  className,
}: SourceCitationProps) {
  return (
    <a
      href={`#source-${source.id}`}
      className={cn(
        "inline-flex items-baseline no-underline hover:underline",
        "underline-offset-2",
        "transition-colors duration-200",
        "font-ui",
        LEAN_COLORS[source.political_lean],
        className
      )}
      aria-label={`Source ${citationNumber}: ${source.title}`}
      title={source.title}
    >
      <sup className="font-medium">[{citationNumber}]</sup>
    </a>
  );
}
