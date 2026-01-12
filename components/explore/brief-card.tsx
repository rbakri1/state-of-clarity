"use client";

import Link from "next/link";
import { Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brief } from "@/lib/types/brief";

interface BriefCardProps {
  brief: Brief;
  onTagClick?: (tag: string) => void;
}

function getClarityScore(brief: Brief): number {
  let score = 0;
  if (typeof brief.clarity_score === "number") {
    score = brief.clarity_score;
  } else if (brief.clarity_score && typeof brief.clarity_score === "object" && "overall" in brief.clarity_score) {
    score = brief.clarity_score.overall;
  }
  // Normalize: if score > 10, it's stored as 0-100, convert to 0-10
  if (score > 10) {
    score = score / 10;
  }
  return score;
}

function getClarityScoreStyles(score: number): string {
  // Score is already normalized to 0-10 scale
  if (score >= 8.5) {
    return "bg-success-light text-success-dark";
  } else if (score >= 7) {
    return "bg-warning-light text-warning-dark";
  }
  return "bg-error-light text-error-dark";
}

function calculateReadingTime(brief: Brief): string {
  const wordsPerMinute = 200;
  let content = brief.narrative || "";
  
  if (Array.isArray(brief.summaries) && brief.summaries.length > 0) {
    content = brief.summaries[0]?.content || content;
  } else if (brief.summaries && typeof brief.summaries === "object") {
    const summaryValues = Object.values(brief.summaries);
    if (summaryValues.length > 0) {
      content = summaryValues[0] || content;
    }
  }
  
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${minutes} min`;
}

function getExcerpt(brief: Brief): string {
  let content = "";
  
  if (Array.isArray(brief.summaries) && brief.summaries.length > 0) {
    content = brief.summaries[0]?.content || "";
  } else if (brief.summaries && typeof brief.summaries === "object") {
    const summaryValues = Object.values(brief.summaries);
    if (summaryValues.length > 0) {
      content = summaryValues[0] || "";
    }
  }
  
  if (!content && brief.narrative) {
    content = brief.narrative;
  }
  
  const plainText = content.replace(/[#*_`\[\]]/g, "").replace(/\n+/g, " ").trim();
  
  if (plainText.length > 120) {
    return plainText.substring(0, 117) + "...";
  }
  return plainText;
}

function getTags(brief: Brief): string[] {
  return brief.metadata?.tags || [];
}

export function BriefCard({ brief, onTagClick }: BriefCardProps) {
  const clarityScore = getClarityScore(brief);
  const readingTime = calculateReadingTime(brief);
  const excerpt = getExcerpt(brief);
  const tags = getTags(brief).slice(0, 3);

  return (
    <div
      className={cn(
        "group relative flex flex-col p-6 rounded-xl",
        "bg-ivory-50 border border-ivory-600",
        "hover:border-sage-400 hover:shadow-md",
        "transition-all duration-200"
      )}
    >
      <Link
        href={`/brief/${brief.id}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
        aria-label={`Read brief: ${brief.question}`}
      />
      
      {/* Score and Read Time */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
          "text-sm font-ui font-medium",
          getClarityScoreStyles(clarityScore)
        )}>
          <Target className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{clarityScore.toFixed(1)}/10</span>
        </div>
        <div className="inline-flex items-center gap-1 text-ink-400 font-ui text-sm">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{readingTime}</span>
        </div>
      </div>

      {/* Question (Title) */}
      <h3 className="font-heading font-semibold text-lg text-ink-800 mb-3 group-hover:text-sage-600 transition-colors duration-200 leading-snug relative z-10">
        {brief.question}
      </h3>

      {/* Excerpt - truncated to 2 lines via CSS */}
      {excerpt && (
        <p className="font-body text-sm text-ink-500 mb-4 line-clamp-2 relative z-10">
          {excerpt}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-auto relative z-10">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTagClick?.(tag);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md",
                "bg-ivory-300 text-ink-500",
                "text-xs font-ui font-medium",
                "hover:bg-sage-100 hover:text-sage-700",
                "transition-colors duration-150",
                onTagClick ? "cursor-pointer" : "cursor-default"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
