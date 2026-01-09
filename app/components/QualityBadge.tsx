"use client";

import { useState } from "react";
import { Shield, ShieldAlert, Info } from "lucide-react";

interface QualityBadgeProps {
  score: number;
  showWarning?: boolean;
}

export default function QualityBadge({
  score,
  showWarning = false,
}: QualityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isHighQuality = score >= 8.0;
  const isAcceptable = score >= 6.0 && score < 8.0;

  const badgeColor = isHighQuality
    ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
    : isAcceptable
    ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
    : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";

  const IconComponent = isHighQuality ? Shield : ShieldAlert;

  const tooltipMessage = isHighQuality
    ? "This brief meets our high quality standards with strong evidence and balanced analysis."
    : isAcceptable
    ? "This brief meets minimum quality standards but may have some limitations in evidence or balance."
    : "This brief did not meet quality standards.";

  if (!showWarning && isHighQuality) {
    return null;
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${badgeColor} transition-colors hover:opacity-90`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-describedby="quality-tooltip"
      >
        <IconComponent className="w-3.5 h-3.5" />
        <span>Quality: {score.toFixed(1)}/10</span>
        <Info className="w-3 h-3 opacity-60" />
      </button>

      {showTooltip && (
        <div
          id="quality-tooltip"
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs bg-popover text-popover-foreground border rounded-lg shadow-lg max-w-xs z-50"
        >
          <div className="text-center">{tooltipMessage}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-popover" />
          </div>
        </div>
      )}
    </div>
  );
}
