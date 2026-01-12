"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type SortOption = "newest" | "oldest" | "score" | "views";

interface SortFilterProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Highest Score", value: "score" },
  { label: "Most Read", value: "views" },
];

export function SortFilter({ value, onChange }: SortFilterProps) {
  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.value === value)?.label || "Newest";

  return (
    <div className="relative">
      <label className="font-ui text-sm font-medium text-ink-600 mb-2 block">
        Sort By
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          className={cn(
            "appearance-none w-full px-4 py-2.5 pr-10 rounded-lg",
            "bg-ivory-50 border border-ivory-500",
            "font-ui text-sm text-ink-700",
            "focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500",
            "transition-colors duration-150",
            "cursor-pointer"
          )}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
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
