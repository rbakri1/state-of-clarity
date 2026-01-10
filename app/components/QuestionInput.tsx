"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";

interface Suggestion {
  text: string;
  source: "template" | "history" | "ai";
  category?: string;
}

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  initialValue?: string;
}

export default function QuestionInput({
  onSubmit,
  initialValue = "",
}: QuestionInputProps) {
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLFormElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  // Debounced API call for suggestions
  useEffect(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (value.length < 2) {
      setShowDropdown(false);
      setSuggestions([]);
      setHighlightedIndex(0);
      setIsLoadingSuggestions(false);
      return;
    }

    // Set loading state and show dropdown
    setIsLoadingSuggestions(true);
    setShowDropdown(true);

    // Debounce the API call by 150ms
    const timeoutId = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(
          `/api/questions/suggest?q=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          // Hide dropdown on error
          setShowDropdown(false);
          setSuggestions([]);
          return;
        }

        const data: Suggestion[] = await response.json();

        if (data.length === 0) {
          // Hide dropdown if no results
          setShowDropdown(false);
          setSuggestions([]);
        } else {
          setSuggestions(data);
          setHighlightedIndex(0);
          setShowDropdown(true);
        }
      } catch (error) {
        // Ignore abort errors, hide dropdown on other errors
        if (error instanceof Error && error.name !== "AbortError") {
          setShowDropdown(false);
          setSuggestions([]);
        }
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 150);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Escape") {
        setShowDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
      case "Tab":
        setShowDropdown(false);
        break;
    }
  }, [showDropdown, suggestions, highlightedIndex]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setValue(suggestion.text);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setShowDropdown(false);
    try {
      await onSubmit(value.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Ask any policy question..."
          className="w-full pl-12 pr-32 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-base"
          disabled={isSubmitting}
        />
        <button
          ref={submitButtonRef}
          type="submit"
          disabled={isSubmitting || !value.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            "Get Brief"
          )}
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {isLoadingSuggestions && suggestions.length === 0 ? (
            <div className="px-4 py-3 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading suggestions...</span>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-3 text-left transition cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center justify-between gap-2 ${
                  index === highlightedIndex
                    ? "bg-primary/10 dark:bg-primary/20"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-sm text-foreground">{suggestion.text}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {suggestion.source === "template" && "Curated"}
                  {suggestion.source === "history" && "Popular"}
                  {suggestion.source === "ai" && "AI ✨"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </form>
  );
}
