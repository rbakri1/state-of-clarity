"use client";

import { useState, useEffect } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { BriefCard } from "./brief-card";
import type { Brief } from "@/lib/types/brief";

interface BriefsResponse {
  briefs: Brief[];
  total: number;
  hasMore: boolean;
}

function BriefCardSkeleton() {
  return (
    <div
      className={cn(
        "flex flex-col p-6 rounded-xl",
        "bg-ivory-50 border border-ivory-600",
        "animate-pulse"
      )}
    >
      {/* Score and Read Time skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-16 bg-ivory-300 rounded-full" />
        <div className="h-5 w-14 bg-ivory-300 rounded" />
      </div>

      {/* Title skeleton */}
      <div className="h-6 bg-ivory-300 rounded mb-2 w-full" />
      <div className="h-6 bg-ivory-300 rounded mb-3 w-3/4" />

      {/* Excerpt skeleton */}
      <div className="h-4 bg-ivory-300 rounded mb-1 w-full" />
      <div className="h-4 bg-ivory-300 rounded mb-4 w-5/6" />

      {/* Tags skeleton */}
      <div className="flex gap-2 mt-auto">
        <div className="h-6 w-16 bg-ivory-300 rounded-md" />
        <div className="h-6 w-20 bg-ivory-300 rounded-md" />
        <div className="h-6 w-14 bg-ivory-300 rounded-md" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className={cn(
        "col-span-full flex flex-col items-center justify-center py-16 px-8",
        "bg-ivory-50 border border-ivory-500 rounded-xl"
      )}
    >
      <div className="w-16 h-16 rounded-full bg-ivory-300 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-ink-400" />
      </div>
      <h3 className="font-heading font-semibold text-lg text-ink-700 mb-2">
        No briefs found
      </h3>
      <p className="font-body text-ink-500 text-center max-w-md">
        There are no briefs matching your criteria. Try adjusting your filters or check back later for new content.
      </p>
    </div>
  );
}

export function BriefsGrid() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBriefs() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/briefs?limit=12&offset=0");
        
        if (!response.ok) {
          throw new Error("Failed to fetch briefs");
        }

        const data: BriefsResponse = await response.json();
        setBriefs(data.briefs);
        setTotal(data.total);
      } catch (err) {
        console.error("Error fetching briefs:", err);
        setError(err instanceof Error ? err.message : "Failed to load briefs");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBriefs();
  }, []);

  const handleTagClick = (tag: string) => {
    // Tag click handling will be implemented in US-009
    console.log("Tag clicked:", tag);
  };

  if (error) {
    return (
      <div
        className={cn(
          "p-8 rounded-xl text-center",
          "bg-error-light border border-error"
        )}
      >
        <p className="font-body text-error-dark">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Results count */}
      <div className="mb-6">
        {isLoading ? (
          <div className="h-5 w-40 bg-ivory-300 rounded animate-pulse" />
        ) : (
          <p className="font-ui text-sm text-ink-500">
            Showing {briefs.length} of {total} {total === 1 ? "brief" : "briefs"}
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <BriefCardSkeleton />
            <BriefCardSkeleton />
            <BriefCardSkeleton />
            <BriefCardSkeleton />
            <BriefCardSkeleton />
            <BriefCardSkeleton />
          </>
        ) : briefs.length === 0 ? (
          <EmptyState />
        ) : (
          briefs.map((brief) => (
            <BriefCard
              key={brief.id}
              brief={brief}
              onTagClick={handleTagClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
