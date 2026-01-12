"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./search-input";
import { TagFilter } from "./tag-filter";
import { ScoreFilter } from "./score-filter";
import { SortFilter, type SortOption } from "./sort-filter";
import { DateFilter, type DateRange } from "./date-filter";
import { MobileFilterDrawer } from "./mobile-filter-drawer";
import { BriefCard } from "./brief-card";
import type { Brief } from "@/lib/types/brief";

interface BriefsResponse {
  briefs: Brief[];
  total: number;
  hasMore: boolean;
}

interface TagWithCount {
  tag: string;
  count: number;
}

interface TagsResponse {
  tags: TagWithCount[];
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

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
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
        {hasSearch ? "No matching briefs" : "No briefs found"}
      </h3>
      <p className="font-body text-ink-500 text-center max-w-md">
        {hasSearch
          ? "Try adjusting your search terms or clearing filters to see more results."
          : "There are no briefs available. Check back later for new content."}
      </p>
    </div>
  );
}

export function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial values from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tagsParam = searchParams.get("tags");
    return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  });
  const [minScore, setMinScore] = useState<number | null>(() => {
    const scoreParam = searchParams.get("minScore");
    return scoreParam ? Number(scoreParam) : null;
  });
  const [sort, setSort] = useState<SortOption>(() => {
    const sortParam = searchParams.get("sort");
    return (sortParam as SortOption) || "newest";
  });
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const dateParam = searchParams.get("date");
    return (dateParam as DateRange) || "all";
  });
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [availableTags, setAvailableTags] = useState<TagWithCount[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update URL when search query changes
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      const newParams = new URLSearchParams(searchParams.toString());
      if (query) {
        newParams.set("q", query);
      } else {
        newParams.delete("q");
      }
      router.replace(`?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Update URL when tags change
  const updateTagsUrl = useCallback(
    (tags: string[]) => {
      const newParams = new URLSearchParams(searchParams.toString());
      if (tags.length > 0) {
        newParams.set("tags", tags.join(","));
      } else {
        newParams.delete("tags");
      }
      router.replace(`?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Update URL when min score changes
  const handleMinScoreChange = useCallback(
    (score: number | null) => {
      setMinScore(score);
      const newParams = new URLSearchParams(searchParams.toString());
      if (score !== null) {
        newParams.set("minScore", String(score));
      } else {
        newParams.delete("minScore");
      }
      router.replace(`?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Update URL when sort changes
  const handleSortChange = useCallback(
    (sortValue: SortOption) => {
      setSort(sortValue);
      const newParams = new URLSearchParams(searchParams.toString());
      if (sortValue !== "newest") {
        newParams.set("sort", sortValue);
      } else {
        newParams.delete("sort");
      }
      router.replace(`?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Update URL when date range changes
  const handleDateRangeChange = useCallback(
    (dateValue: DateRange) => {
      setDateRange(dateValue);
      const newParams = new URLSearchParams(searchParams.toString());
      if (dateValue !== "all") {
        newParams.set("date", dateValue);
      } else {
        newParams.delete("date");
      }
      router.replace(`?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Toggle a tag on/off
  const handleTagToggle = useCallback(
    (tag: string) => {
      setSelectedTags((prev) => {
        const newTags = prev.includes(tag)
          ? prev.filter((t) => t !== tag)
          : [...prev, tag];
        updateTagsUrl(newTags);
        return newTags;
      });
    },
    [updateTagsUrl]
  );

  // Sync search query, tags, minScore, and sort from URL on mount/navigation
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
    const urlTags = searchParams.get("tags");
    const parsedTags = urlTags ? urlTags.split(",").filter(Boolean) : [];
    if (JSON.stringify(parsedTags) !== JSON.stringify(selectedTags)) {
      setSelectedTags(parsedTags);
    }
    const urlMinScore = searchParams.get("minScore");
    const parsedMinScore = urlMinScore ? Number(urlMinScore) : null;
    if (parsedMinScore !== minScore) {
      setMinScore(parsedMinScore);
    }
    const urlSort = searchParams.get("sort") as SortOption | null;
    const parsedSort = urlSort || "newest";
    if (parsedSort !== sort) {
      setSort(parsedSort);
    }
    const urlDateRange = searchParams.get("date") as DateRange | null;
    const parsedDateRange = urlDateRange || "all";
    if (parsedDateRange !== dateRange) {
      setDateRange(parsedDateRange);
    }
  }, [searchParams]);

  // Fetch available tags from dedicated endpoint
  useEffect(() => {
    async function fetchTags() {
      setIsTagsLoading(true);
      try {
        const response = await fetch("/api/briefs/tags");
        if (response.ok) {
          const data: TagsResponse = await response.json();
          setAvailableTags(data.tags);
        }
      } catch (err) {
        console.error("Error fetching tags:", err);
      } finally {
        setIsTagsLoading(false);
      }
    }
    fetchTags();
  }, []);

  // Fetch briefs when search query, tags, minScore, or sort change
  useEffect(() => {
    async function fetchBriefs() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", "12");
        params.set("offset", "0");
        if (searchQuery) {
          params.set("q", searchQuery);
        }
        if (selectedTags.length > 0) {
          params.set("tags", selectedTags.join(","));
        }
        if (minScore !== null) {
          params.set("minScore", String(minScore));
        }
        if (sort !== "newest") {
          params.set("sort", sort);
        }
        if (dateRange !== "all") {
          params.set("date", dateRange);
        }

        const response = await fetch(`/api/briefs?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch briefs");
        }

        const data: BriefsResponse = await response.json();
        setBriefs(data.briefs);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Error fetching briefs:", err);
        setError(err instanceof Error ? err.message : "Failed to load briefs");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBriefs();
  }, [searchQuery, selectedTags, minScore, sort, dateRange]);

  const handleTagClick = useCallback(
    (tag: string) => {
      handleTagToggle(tag);
    },
    [handleTagToggle]
  );

  // Load more briefs (pagination)
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "12");
      params.set("offset", String(briefs.length));
      if (searchQuery) {
        params.set("q", searchQuery);
      }
      if (selectedTags.length > 0) {
        params.set("tags", selectedTags.join(","));
      }
      if (minScore !== null) {
        params.set("minScore", String(minScore));
      }
      if (sort !== "newest") {
        params.set("sort", sort);
      }
      if (dateRange !== "all") {
        params.set("date", dateRange);
      }

      const response = await fetch(`/api/briefs?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load more briefs");
      }

      const data: BriefsResponse = await response.json();
      setBriefs((prev) => [...prev, ...data.briefs]);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error loading more briefs:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, briefs.length, searchQuery, selectedTags, minScore, sort, dateRange]);

  if (error) {
    return (
      <div>
        {/* Search input */}
        <div className="mb-8">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search briefs by keyword..."
          />
        </div>
        <div
          className={cn(
            "p-8 rounded-xl text-center",
            "bg-error-light border border-error"
          )}
        >
          <p className="font-body text-error-dark">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search input */}
      <div className="mb-8">
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search briefs by keyword..."
        />
      </div>

      {/* Mobile filter drawer */}
      <div className="mb-6 md:hidden">
        <MobileFilterDrawer
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          isTagsLoading={isTagsLoading}
          minScore={minScore}
          onMinScoreChange={handleMinScoreChange}
          sort={sort}
          onSortChange={handleSortChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {/* Desktop filters - hidden on mobile */}
      <div className="hidden md:block">
        {/* Tag filter */}
        <TagFilter
          tags={availableTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          isLoading={isTagsLoading}
        />

        {/* Score, Date, and Sort filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-40">
            <ScoreFilter value={minScore} onChange={handleMinScoreChange} />
          </div>
          <div className="w-40">
            <DateFilter value={dateRange} onChange={handleDateRangeChange} />
          </div>
          <div className="w-40">
            <SortFilter value={sort} onChange={handleSortChange} />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6">
        {isLoading ? (
          <div className="h-5 w-40 bg-ivory-300 rounded animate-pulse" />
        ) : (
          <p className="font-ui text-sm text-ink-500">
            Showing {briefs.length} of {total}{" "}
            {total === 1 ? "brief" : "briefs"}
            {searchQuery && (
              <span className="text-ink-400">
                {" "}
                for &quot;{searchQuery}&quot;
              </span>
            )}
            {selectedTags.length > 0 && (
              <span className="text-ink-400">
                {" "}
                with tags: {selectedTags.join(", ")}
              </span>
            )}
            {minScore !== null && (
              <span className="text-ink-400">
                {" "}
                with score {minScore}+
              </span>
            )}
            {dateRange !== "all" && (
              <span className="text-ink-400">
                {" "}
                from past {dateRange}
              </span>
            )}
            {sort !== "newest" && (
              <span className="text-ink-400">
                {" "}
                sorted by {sort === "oldest" ? "oldest" : sort === "score" ? "highest score" : "most read"}
              </span>
            )}
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
          <EmptyState hasSearch={!!searchQuery} />
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

      {/* Load More button */}
      {!isLoading && hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className={cn(
              "px-6 py-3 rounded-lg",
              "bg-sage-100 text-sage-600 font-ui font-medium",
              "hover:bg-sage-200 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
