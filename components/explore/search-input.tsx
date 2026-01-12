"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search briefs...",
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when prop changes (e.g., from URL)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the onChange callback (300ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localValue, value, onChange]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
  }, [onChange]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400 pointer-events-none" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-12 pr-10 py-3 rounded-xl",
          "bg-ivory-50 border border-ivory-500",
          "font-body text-ink-700 placeholder:text-ink-400",
          "focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400",
          "transition-colors"
        )}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "p-1 rounded-full",
            "text-ink-400 hover:text-ink-600 hover:bg-ivory-200",
            "transition-colors"
          )}
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
