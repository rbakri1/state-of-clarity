"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// Import sample briefs (in production, this would come from API)
import briefUK4Day from "@/sample-briefs/uk-four-day-week.json";
import briefWhatIsState from "@/sample-briefs/what-is-a-state.json";

import type { ReadingLevel } from "@/lib/supabase/client";
import { ReadingLevelSelector } from "@/app/components/ReadingLevelSelector";
import { StructuredDataSections } from "@/app/components/StructuredDataSections";
import { NarrativeSection } from "@/app/components/NarrativeSection";
import { SourcesSection, type Source } from "@/app/components/SourcesSection";
import ClarityScoreModal from "@/app/components/ClarityScoreModal";
import { ShareMenu } from "@/app/components/ShareMenu";
import { BookmarkButton } from "@/app/components/BookmarkButton";
import { ReadingProgressBar } from "@/app/components/ReadingProgressBar";

const READING_LEVEL_STORAGE_KEY = "soc_reading_level";

function isValidReadingLevel(level: string | null): level is ReadingLevel {
  return level === "simple" || level === "standard" || level === "advanced";
}

export default function BriefPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize level from URL, then localStorage, then default to 'standard'
  const getInitialLevel = useCallback((): ReadingLevel => {
    const urlLevel = searchParams.get("level");
    if (isValidReadingLevel(urlLevel)) {
      return urlLevel;
    }
    if (typeof window !== "undefined") {
      const storedLevel = localStorage.getItem(READING_LEVEL_STORAGE_KEY);
      if (isValidReadingLevel(storedLevel)) {
        return storedLevel;
      }
    }
    return "standard";
  }, [searchParams]);

  const [activeLevel, setActiveLevel] = useState<ReadingLevel>("standard");

  // Sync URL to state on mount
  useEffect(() => {
    const initialLevel = getInitialLevel();
    setActiveLevel(initialLevel);
    
    // Sync URL if it doesn't match the determined level
    const urlLevel = searchParams.get("level");
    if (urlLevel !== initialLevel) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("level", initialLevel);
      router.replace(`?${newParams.toString()}`, { scroll: false });
    }
  }, []);

  const handleLevelChange = useCallback((level: ReadingLevel) => {
    setActiveLevel(level);
    
    // Update URL without page reload
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("level", level);
    router.replace(`?${newParams.toString()}`, { scroll: false });
    
    // Store in localStorage
    localStorage.setItem(READING_LEVEL_STORAGE_KEY, level);
  }, [searchParams, router]);

  const [isClarityModalOpen, setIsClarityModalOpen] = useState(false);

  // In production, fetch brief by ID from API
  const briefs: { [key: string]: any } = {
    "uk-four-day-week": briefUK4Day,
    "what-is-a-state": briefWhatIsState,
  };

  const brief = briefs[params.id as string] || briefUK4Day;

  const getClarityScoreColorClass = (score: number) => {
    if (score >= 8) return "bg-green-500 text-white";
    if (score >= 6) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Reading Progress Bar */}
      <ReadingProgressBar contentSelector="[data-brief-content]" />
      
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">State of Clarity</span>
            </Link>

            <div className="flex items-center gap-2">
              <ShareMenu
                title={brief.question}
                excerpt={brief.summaries.standard?.slice(0, 100)}
              />
              <BookmarkButton briefId={params.id as string} />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition">
                Ask Follow-up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - max-width 768px centered */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12" data-brief-content>
        {/* Brief Header Section */}
        <section className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{brief.question}</h1>
            <button
              onClick={() => setIsClarityModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm shrink-0 hover:opacity-90 transition cursor-pointer ${getClarityScoreColorClass(brief.clarity_score)}`}
              aria-label="View clarity score breakdown"
            >
              <Sparkles className="w-4 h-4" />
              <span>{brief.clarity_score}/10</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>
              Version {brief.version} • Updated{" "}
              {new Date(brief.updated_at).toLocaleDateString()}
            </span>
            <span>•</span>
            <span>{brief.sources.length} sources</span>
            <span>•</span>
            <div className="flex flex-wrap gap-2">
              {brief.metadata.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Reading Level Selector */}
        <section className="mb-10">
          <ReadingLevelSelector
            level={activeLevel}
            onLevelChange={handleLevelChange}
          />
        </section>

        {/* Summary Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <div 
            key={activeLevel}
            className="animate-fade-in"
            style={{ maxWidth: '65ch' }}
          >
            <p className="text-base leading-relaxed text-muted-foreground">
              {brief.summaries[activeLevel]}
            </p>
          </div>
        </section>

        {/* Structured Data Sections */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Structured Analysis</h2>
          <StructuredDataSections
            structuredData={brief.structured_data}
            historicalSummary={brief.historical_summary}
          />
        </section>

        {/* Narrative Analysis */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Narrative Analysis</h2>
          <NarrativeSection
            narrative={brief.narrative}
            sources={brief.sources}
          />
        </section>

        {/* Sources Section */}
        <section className="mb-12">
          <SourcesSection sources={brief.sources as Source[]} />
        </section>

        {/* Feedback Section */}
        <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Help Improve This Brief</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Found an issue or have a suggestion? Your feedback helps make
            this brief more accurate and useful.
          </p>

          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm">Helpful</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <ThumbsDown className="w-4 h-4" />
              <span className="text-sm">Not Helpful</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">Suggest Source</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Spot Error</span>
            </button>
          </div>
        </section>
      </main>

      {/* Clarity Score Modal */}
      <ClarityScoreModal
        isOpen={isClarityModalOpen}
        onClose={() => setIsClarityModalOpen(false)}
        score={brief.clarity_score}
        breakdown={brief.clarity_critique.breakdown}
        strengths={brief.clarity_critique.strengths}
        gaps={brief.clarity_critique.gaps}
      />
    </div>
  );
}
