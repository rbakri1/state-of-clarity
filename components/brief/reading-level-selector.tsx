"use client";

import { cn } from "@/lib/utils";
import type { ReadingLevel } from "@/lib/types/brief";

interface ReadingLevelSelectorProps {
  currentLevel: ReadingLevel;
  onLevelChange: (level: ReadingLevel) => void;
  className?: string;
}

const LEVELS = [
  { value: "child" as const, label: "Child", audience: "Ages 8–12" },
  { value: "teen" as const, label: "Teen", audience: "Ages 13–17" },
  { value: "undergrad" as const, label: "Undergrad", audience: "Ages 18–22" },
  { value: "postdoc" as const, label: "Postdoc", audience: "Graduate researchers" },
];

export function ReadingLevelSelector({
  currentLevel,
  onLevelChange,
  className,
}: ReadingLevelSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Reading level selector"
      className={cn(
        "sticky top-4 z-20",
        "flex flex-col gap-2 sm:flex-row sm:gap-1",
        "bg-ivory-100 rounded-lg shadow-sm border border-ivory-600 p-2",
        className
      )}
    >
      {LEVELS.map((level) => (
        <button
          key={level.value}
          role="tab"
          aria-selected={currentLevel === level.value}
          aria-controls={`panel-${level.value}`}
          id={`tab-${level.value}`}
          onClick={() => onLevelChange(level.value)}
          className={cn(
            "px-4 py-3 rounded-md font-ui transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
            "min-h-[48px] min-w-[48px]",
            "hover:scale-[1.02] active:scale-[0.98]",
            currentLevel === level.value
              ? "bg-sage-500 text-ivory-100 font-semibold shadow-md"
              : "bg-transparent text-ink-600 hover:bg-ivory-300 font-medium"
          )}
        >
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-sm uppercase tracking-wide">{level.label}</span>
            <span className={cn(
              "text-xs",
              currentLevel === level.value ? "text-ivory-200" : "text-ink-400"
            )}>
              {level.audience}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
