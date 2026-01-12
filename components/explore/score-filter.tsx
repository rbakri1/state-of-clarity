"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface ScoreFilterProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const SCORE_OPTIONS = [
  { label: "All Scores", value: null },
  { label: "7+ Score", value: 7 },
  { label: "8+ Score", value: 8 },
  { label: "9+ Score", value: 9 },
];

export function ScoreFilter({ value, onChange }: ScoreFilterProps) {
  const currentLabel =
    SCORE_OPTIONS.find((opt) => opt.value === value)?.label || "All Scores";

  return (
    <div className="relative">
      <label className="font-ui text-sm font-medium text-ink-600 mb-2 block">
        Min Score
      </label>
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => {
            const newValue = e.target.value === "" ? null : Number(e.target.value);
            onChange(newValue);
          }}
          className={cn(
            "appearance-none w-full px-4 py-2.5 pr-10 rounded-lg",
            "bg-ivory-50 border border-ivory-500",
            "font-ui text-sm text-ink-700",
            "focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500",
            "transition-colors duration-150",
            "cursor-pointer"
          )}
        >
          {SCORE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value ?? ""}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none"
        />
      </div>
    </div>
  );
}
