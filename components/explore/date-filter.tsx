"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type DateRange = "all" | "week" | "month" | "year";

interface DateFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

const DATE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "All Time", value: "all" },
  { label: "Past Week", value: "week" },
  { label: "Past Month", value: "month" },
  { label: "Past Year", value: "year" },
];

export function DateFilter({ value, onChange }: DateFilterProps) {
  return (
    <div className="relative">
      <label className="font-ui text-sm font-medium text-ink-600 mb-2 block">
        Date Range
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as DateRange)}
          className={cn(
            "appearance-none w-full px-4 py-2.5 pr-10 rounded-lg",
            "bg-ivory-50 border border-ivory-500",
            "font-ui text-sm text-ink-700",
            "focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500",
            "transition-colors duration-150",
            "cursor-pointer"
          )}
        >
          {DATE_OPTIONS.map((option) => (
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
