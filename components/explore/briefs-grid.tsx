"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Clock, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Brief {
  id: string;
  question: string;
  clarity_score: number;
  tags: string[];
  readTime: string;
}

interface BriefsGridProps {
  searchQuery: string;
  onTagClick?: (tag: string) => void;
}

const SAMPLE_BRIEFS: Brief[] = [
  {
    id: "what-is-a-state",
    question: "What is a state?",
    clarity_score: 8.7,
    tags: ["Foundational", "Political Philosophy", "First Principles"],
    readTime: "4 min",
  },
  {
    id: "uk-four-day-week",
    question: "What would be the impacts of a 4-day work week in the UK?",
    clarity_score: 8.4,
    tags: ["Economics", "Labor Policy", "Wellbeing"],
    readTime: "6 min",
  },
  {
    id: "net-zero-2050",
    question: "Can the UK reach net zero by 2050?",
    clarity_score: 8.2,
    tags: ["Climate", "Energy Policy", "Environment"],
    readTime: "5 min",
  },
  {
    id: "universal-basic-income",
    question: "What are the pros and cons of Universal Basic Income?",
    clarity_score: 8.5,
    tags: ["Economics", "Social Policy", "Welfare"],
    readTime: "7 min",
  },
  {
    id: "immigration-uk",
    question: "What is the impact of immigration on the UK economy?",
    clarity_score: 8.3,
    tags: ["Economics", "Immigration", "Demographics"],
    readTime: "5 min",
  },
  {
    id: "nhs-funding",
    question: "Is the NHS adequately funded?",
    clarity_score: 8.1,
    tags: ["Healthcare", "Public Spending", "Policy Analysis"],
    readTime: "6 min",
  },
];

export function BriefsGrid({ searchQuery, onTagClick }: BriefsGridProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredBriefs = useMemo(() => {
    if (!searchQuery.trim()) return SAMPLE_BRIEFS;

    const query = searchQuery.toLowerCase();
    return SAMPLE_BRIEFS.filter(
      (brief) =>
        brief.question.toLowerCase().includes(query) ||
        brief.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-ivory-500 bg-ivory-50 p-5 animate-pulse"
          >
            <div className="h-5 w-3/4 bg-ivory-300 rounded mb-3" />
            <div className="h-4 w-1/2 bg-ivory-300 rounded mb-4" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-ivory-300 rounded-full" />
              <div className="h-6 w-20 bg-ivory-300 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredBriefs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-500 font-body">
          No briefs found for "{searchQuery}"
        </p>
        <p className="text-ink-400 text-sm mt-2 font-ui">
          Try a different search term or browse all briefs
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredBriefs.map((brief) => (
        <Link
          key={brief.id}
          href={`/brief/${brief.id}`}
          className={cn(
            "group rounded-xl border border-ivory-500 bg-ivory-50 p-5",
            "hover:border-sage-500 hover:shadow-md",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
          )}
        >
          <h3 className="font-heading text-ink-800 text-lg leading-snug mb-2 group-hover:text-sage-700 transition-colors">
            {brief.question}
          </h3>

          <div className="flex items-center gap-4 text-sm text-ink-500 mb-3">
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-sage-500" />
              <span className="font-ui">{brief.clarity_score.toFixed(1)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-ink-400" />
              <span className="font-ui">{brief.readTime}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {brief.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onTagClick?.(tag);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-ui",
                  "bg-sage-100 text-sage-700",
                  "hover:bg-sage-200 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center text-sage-600 text-sm font-ui group-hover:text-sage-700">
            <span>Read brief</span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      ))}
    </div>
  );
}
