"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReadingLevel } from "@/lib/types/brief";

interface SummaryCardProps {
  level: ReadingLevel;
  content: string;
  isActive: boolean;
  className?: string;
}

const LEVEL_STYLES: Record<ReadingLevel, { text: string; lineHeight: string }> = {
  child: { text: "text-lg", lineHeight: "leading-relaxed" },
  teen: { text: "text-base", lineHeight: "leading-normal" },
  undergrad: { text: "text-base", lineHeight: "leading-normal" },
  postdoc: { text: "text-base", lineHeight: "leading-snug" },
};

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function SummaryCard({
  level,
  content,
  isActive,
  className,
}: SummaryCardProps) {
  const styles = LEVEL_STYLES[level];
  const readingTime = calculateReadingTime(content);

  return (
    <div
      id={`panel-${level}`}
      role="tabpanel"
      aria-labelledby={`tab-${level}`}
      hidden={!isActive}
      className={cn(
        "prose prose-custom max-w-prose mx-auto",
        "animate-in fade-in duration-300",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-ink-500 font-ui mb-4">
        <Clock className="w-4 h-4" aria-hidden="true" />
        <span>{readingTime} min read</span>
      </div>

      <div
        className={cn(
          styles.text,
          styles.lineHeight,
          "text-ink-800 font-body"
        )}
      >
        {content}
      </div>
    </div>
  );
}
