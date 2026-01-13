"use client";

import type { ReadingLevel } from "@/lib/supabase/client";

interface ReadingLevelSelectorProps {
  level: ReadingLevel;
  onLevelChange: (level: ReadingLevel) => void;
  compact?: boolean;
}

const levels: { key: ReadingLevel; label: string }[] = [
  { key: "simple", label: "Simple" },
  { key: "standard", label: "Standard" },
  { key: "advanced", label: "Advanced" },
];

export function ReadingLevelSelector({
  level,
  onLevelChange,
  compact = false,
}: ReadingLevelSelectorProps) {
  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {levels.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onLevelChange(key)}
          className={`${compact ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-full text-sm font-medium transition-all ${
            level === key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
