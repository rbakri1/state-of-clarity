"use client";

import { cn } from "@/lib/utils";

interface TagWithCount {
  tag: string;
  count: number;
}

interface TagFilterProps {
  tags: TagWithCount[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  isLoading?: boolean;
}

function TagFilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-8 bg-ivory-300 rounded-full animate-pulse"
          style={{ width: `${60 + Math.random() * 40}px` }}
        />
      ))}
    </div>
  );
}

export function TagFilter({
  tags,
  selectedTags,
  onTagToggle,
  isLoading = false,
}: TagFilterProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="font-ui text-sm font-medium text-ink-600 mb-3">
          Filter by Tags
        </h3>
        <TagFilterSkeleton />
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="font-ui text-sm font-medium text-ink-600 mb-3">
        Filter by Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag, count }) => {
          const isActive = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTagToggle(tag)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "text-sm font-ui font-medium",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                isActive
                  ? "bg-sage-500 text-white hover:bg-sage-600"
                  : "bg-ivory-200 text-ink-600 hover:bg-ivory-300"
              )}
              aria-pressed={isActive}
            >
              <span>{tag}</span>
              <span
                className={cn(
                  "inline-flex items-center justify-center",
                  "min-w-[1.25rem] h-5 px-1 rounded-full",
                  "text-xs",
                  isActive
                    ? "bg-sage-600 text-sage-100"
                    : "bg-ivory-400 text-ink-500"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
