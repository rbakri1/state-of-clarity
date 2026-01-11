"use client";

import { useEffect, useState } from "react";
import { Sparkles, Lock } from "lucide-react";
import { useAuthModal } from "./auth/AuthModal";

interface BriefPreviewProps {
  narrative: string;
  question: string;
  clarityScore?: number;
}

const PREVIEW_COUNT_KEY = "soc_preview_count";

function getPreviewCount(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(PREVIEW_COUNT_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function incrementPreviewCount(): number {
  const current = getPreviewCount();
  const updated = current + 1;
  localStorage.setItem(PREVIEW_COUNT_KEY, updated.toString());
  return updated;
}

export function BriefPreview({
  narrative,
  question,
  clarityScore = 0,
}: BriefPreviewProps) {
  const { openModal } = useAuthModal();
  const [previewCount, setPreviewCount] = useState(0);

  useEffect(() => {
    const count = incrementPreviewCount();
    setPreviewCount(count);
  }, []);

  const words = narrative.split(/\s+/);
  const totalWords = words.length;
  const previewWordCount = Math.ceil(totalWords * 0.2);
  const previewText = words.slice(0, previewWordCount).join(" ");
  const hiddenPercentage = Math.round(
    ((totalWords - previewWordCount) / totalWords) * 100
  );

  const getClarityScoreClass = (score: number) => {
    if (score >= 8) return "high";
    if (score >= 6) return "medium";
    return "low";
  };

  return (
    <div className="relative">
      {/* Brief Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold">{question}</h1>
          {clarityScore > 0 && (
            <div
              className={`clarity-score-badge ${getClarityScoreClass(
                clarityScore
              )} shrink-0`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{clarityScore}/10</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="relative">
        <article className="prose prose-clarity max-w-none dark:prose-invert">
          <p className="text-lg leading-relaxed">{previewText}...</p>
        </article>

        {/* Gradient Fade Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
      </div>

      {/* Sign Up CTA */}
      <div className="relative z-10 -mt-16 pt-20 pb-8 bg-gradient-to-t from-white dark:from-gray-900 via-white dark:via-gray-900 to-transparent">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <h3 className="text-2xl font-bold mb-2">
            Continue reading this brief
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            You&apos;ve seen {Math.round(100 - hiddenPercentage)}% of this
            brief. Sign up to read the full analysis and access unlimited
            briefs.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => openModal("signup")}
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Sign up to read full brief
            </button>
            <button
              onClick={() => openModal("signin")}
              className="px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Sign in
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Preview #{previewCount} • Free account includes unlimited briefs
          </p>
        </div>
      </div>
    </div>
  );
}
