"use client";

import { Clock, GraduationCap, BookOpen, Baby, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReadingLevel } from "@/lib/types/brief";

interface SummaryCardProps {
  level: ReadingLevel;
  content: string;
  isActive: boolean;
  className?: string;
}

const LEVEL_CONFIG: Record<ReadingLevel, {
  text: string;
  lineHeight: string;
  label: string;
  description: string;
  icon: any;
  badgeColor: string;
}> = {
  child: {
    text: "text-lg",
    lineHeight: "leading-relaxed",
    label: "Child",
    description: "Ages 8-12",
    icon: Baby,
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
  },
  teen: {
    text: "text-base",
    lineHeight: "leading-normal",
    label: "Teen",
    description: "Ages 13-17",
    icon: BookOpen,
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
  },
  undergrad: {
    text: "text-base",
    lineHeight: "leading-normal",
    label: "Undergraduate",
    description: "University Level",
    icon: GraduationCap,
    badgeColor: "bg-green-100 text-green-700 border-green-200",
  },
  postdoc: {
    text: "text-base",
    lineHeight: "leading-snug",
    label: "Expert",
    description: "Research Level",
    icon: Lightbulb,
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
  },
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
  const config = LEVEL_CONFIG[level];
  const readingTime = content ? calculateReadingTime(content) : 0;
  const Icon = config.icon;

  // Handle empty content
  if (!content || content.trim().length === 0) {
    return (
      <div
        id={`panel-${level}`}
        role="tabpanel"
        aria-labelledby={`tab-${level}`}
        hidden={!isActive}
        className={cn(
          "max-w-prose mx-auto",
          "animate-in fade-in slide-in-from-bottom-4 duration-500",
          className
        )}
      >
        <div className="p-8 text-center border-2 border-dashed border-ivory-400 rounded-lg bg-ivory-50">
          <Icon className="w-8 h-8 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 font-body mb-2">
            No summary available for this level yet.
          </p>
          <p className="text-sm text-ink-400 font-body">
            Try another reading level or check back soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`panel-${level}`}
      role="tabpanel"
      aria-labelledby={`tab-${level}`}
      aria-live="polite"
      hidden={!isActive}
      className={cn(
        "prose prose-custom max-w-prose mx-auto",
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
    >
      {/* Header with level badge and reading time */}
      <div className="flex items-center justify-between mb-4 not-prose">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-ink-500" aria-hidden="true" />
          <span className="text-sm text-ink-500 font-ui">{readingTime} min read</span>
        </div>

        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border",
          config.badgeColor
        )}>
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{config.label}</span>
          <span className="opacity-70">• {config.description}</span>
        </div>
      </div>

      {/* Summary content */}
      <div
        className={cn(
          config.text,
          config.lineHeight,
          "text-ink-800 font-body whitespace-pre-wrap"
        )}
      >
        {content}
      </div>
    </div>
  );
}
