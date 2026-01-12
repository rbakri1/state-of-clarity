"use client";

import { useState, useEffect, useCallback } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TagFilter } from "./tag-filter";
import { ScoreFilter } from "./score-filter";
import { SortFilter, type SortOption } from "./sort-filter";
import { DateFilter, type DateRange } from "./date-filter";

interface TagWithCount {
  tag: string;
  count: number;
}

interface MobileFilterDrawerProps {
  // Tags
  availableTags: TagWithCount[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  isTagsLoading?: boolean;
  // Score
  minScore: number | null;
  onMinScoreChange: (value: number | null) => void;
  // Sort
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  // Date
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
}

export function MobileFilterDrawer({
  availableTags,
  selectedTags,
  onTagToggle,
  isTagsLoading = false,
  minScore,
  onMinScoreChange,
  sort,
  onSortChange,
  dateRange,
  onDateRangeChange,
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeFilterCount =
    selectedTags.length +
    (minScore !== null ? 1 : 0) +
    (sort !== "newest" ? 1 : 0) +
    (dateRange !== "all" ? 1 : 0);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    selectedTags.forEach((tag) => onTagToggle(tag));
    onMinScoreChange(null);
    onSortChange("newest");
    onDateRangeChange("all");
  }, [selectedTags, onTagToggle, onMinScoreChange, onSortChange, onDateRangeChange]);

  // Close drawer
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  return (
    <>
      {/* Filter button - visible on mobile only */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "md:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-lg",
          "bg-ivory-100 border border-ivory-500",
          "font-ui text-sm font-medium text-ink-700",
          "hover:bg-ivory-200 transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span
            className={cn(
              "inline-flex items-center justify-center",
              "min-w-[1.25rem] h-5 px-1.5 rounded-full",
              "text-xs font-medium",
              "bg-sage-500 text-white"
            )}
          >
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink-900/50 z-40 md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 md:hidden",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Filter options"
      >
        <div className="bg-ivory-50 rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-ivory-300">
            <h2 className="font-heading text-lg font-semibold text-ink-800">
              Filters
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                "p-2 rounded-lg",
                "hover:bg-ivory-200 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
              )}
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-ink-600" />
            </button>
          </div>

          {/* Filter content - scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Tags */}
            <TagFilter
              tags={availableTags}
              selectedTags={selectedTags}
              onTagToggle={onTagToggle}
              isLoading={isTagsLoading}
            />

            {/* Score filter */}
            <ScoreFilter value={minScore} onChange={onMinScoreChange} />

            {/* Date filter */}
            <DateFilter value={dateRange} onChange={onDateRangeChange} />

            {/* Sort filter */}
            <SortFilter value={sort} onChange={onSortChange} />
          </div>

          {/* Footer with actions */}
          <div className="flex gap-3 px-6 py-4 border-t border-ivory-300 bg-ivory-100">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={activeFilterCount === 0}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg",
                "bg-ivory-200 text-ink-600 font-ui font-medium",
                "hover:bg-ivory-300 transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg",
                "bg-sage-500 text-white font-ui font-medium",
                "hover:bg-sage-600 transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              )}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
