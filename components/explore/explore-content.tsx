"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchInput } from "./search-input";
import { BriefsGrid } from "./briefs-grid";

export function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize search from URL
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sync from URL on mount
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    setSearchQuery(urlQuery);
  }, [searchParams]);

  const updateUrlParams = useCallback((newQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newQuery.trim()) {
      params.set("q", newQuery.trim());
    } else {
      params.delete("q");
    }
    
    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : "/explore", { scroll: false });
  }, [searchParams, router]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    updateUrlParams(value);
  }, [updateUrlParams]);

  const handleTagClick = useCallback((tag: string) => {
    // Tag filtering will be implemented in US-009
    console.log("Tag clicked:", tag);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="max-w-xl">
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search briefs by keyword..."
        />
      </div>

      {/* Briefs Grid */}
      <BriefsGrid
        searchQuery={searchQuery}
        onTagClick={handleTagClick}
      />
    </div>
  );
}
