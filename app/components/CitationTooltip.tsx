"use client";

import { useState, useRef, useEffect } from "react";

export interface CitationSource {
  id?: string;
  title: string;
  publisher: string | null;
  publication_date: string | null;
  political_lean:
    | "left"
    | "center-left"
    | "center"
    | "center-right"
    | "right"
    | "unknown"
    | null;
  credibility_score: number | null;
}

interface CitationTooltipProps {
  source: CitationSource;
  citationNumber: number;
  onCitationClick?: () => void;
  children?: React.ReactNode;
}

const politicalLeanColors: Record<string, { bg: string; text: string }> = {
  left: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-200" },
  "center-left": { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300" },
  center: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
  "center-right": { bg: "bg-red-50 dark:bg-red-950", text: "text-red-700 dark:text-red-300" },
  right: { bg: "bg-red-100 dark:bg-red-900", text: "text-red-800 dark:text-red-200" },
  unknown: { bg: "bg-gray-50 dark:bg-gray-900", text: "text-gray-500 dark:text-gray-400" },
};

function formatPoliticalLean(lean: string | null): string {
  if (!lean) return "Unknown";
  return lean
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function CitationTooltip({
  source,
  citationNumber,
  onCitationClick,
}: CitationTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 100);
  };

  const hideTooltip = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Check if tooltip would overflow top of viewport
      if (triggerRect.top - tooltipRect.height - 8 < 0) {
        setPosition("bottom");
      } else if (triggerRect.bottom + tooltipRect.height + 8 > viewportHeight) {
        setPosition("top");
      } else {
        setPosition("top");
      }
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const leanKey = source.political_lean || "unknown";
  const leanColors = politicalLeanColors[leanKey] || politicalLeanColors.unknown;

  return (
    <span className="relative inline">
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={onCitationClick}
        className="cursor-pointer text-primary hover:text-primary/80 transition-colors"
      >
        <sup className="text-xs font-medium">[{citationNumber}]</sup>
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-72 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ${
            position === "top"
              ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
              : "top-full mt-2 left-1/2 -translate-x-1/2"
          }`}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rotate-45 left-1/2 -translate-x-1/2 ${
              position === "top"
                ? "bottom-0 translate-y-1/2 border-r border-b"
                : "top-0 -translate-y-1/2 border-l border-t"
            }`}
          />

          {/* Content */}
          <div className="relative">
            {/* Title */}
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
              {source.title}
            </h4>

            {/* Publisher and Date */}
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {source.publisher || "Unknown publisher"}
              {" · "}
              {formatDate(source.publication_date)}
            </p>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Political Lean Badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${leanColors.bg} ${leanColors.text}`}
              >
                {formatPoliticalLean(source.political_lean)}
              </span>

              {/* Credibility Score */}
              {source.credibility_score !== null && (
                <span className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <span className="mr-1">Credibility:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {source.credibility_score.toFixed(1)}/10
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
