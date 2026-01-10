"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
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
  const [expandedSections, setExpandedSections] = useState({
    posit: true,
    principles: false,
  });
  const [isClarityModalOpen, setIsClarityModalOpen] = useState(false);

  // In production, fetch brief by ID from API
  const briefs: { [key: string]: any } = {
    "uk-four-day-week": briefUK4Day,
    "what-is-a-state": briefWhatIsState,
  };

  const brief = briefs[params.id as string] || briefUK4Day;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getClarityScoreColorClass = (score: number) => {
    if (score >= 8) return "bg-green-500 text-white";
    if (score >= 6) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const getPoliticalLeanClass = (lean: string) => {
    if (lean.includes("left")) return "left";
    if (lean.includes("right")) return "right";
    return "center";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Reading Progress Bar */}
      <ReadingProgressBar contentSelector="[data-brief-content]" />
      
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-brief-content>
        {/* Brief Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold">{brief.question}</h1>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* POSIT (if present) */}
            {brief.posit && (
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <button
                  onClick={() => toggleSection("posit")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <h2 className="text-xl font-bold">POSIT</h2>
                  {expandedSections.posit ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {expandedSections.posit && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-primary mb-2">Question:</h3>
                      <p className="text-base">{brief.posit.question}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary mb-2">Relevance:</h3>
                      <p className="text-base text-muted-foreground">{brief.posit.relevance}</p>
                    </div>
                  </div>
                )}
              </section>
            )}



            {/* Foundational Principles (if present) */}
            {brief.foundational_principles?.enabled && (
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <button
                  onClick={() => toggleSection("principles")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <h2 className="text-xl font-bold">Foundational Principles</h2>
                  {expandedSections.principles ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {expandedSections.principles && (
                  <div className="space-y-4">
                    <p className="text-sm italic text-muted-foreground mb-4">
                      These principles guide our analysis, force-ranked by importance:
                    </p>

                    {brief.foundational_principles.principles.map((principle: any) => (
                      <div key={principle.rank} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{principle.rank}. {principle.name}</h3>
                        </div>
                        <p className="text-sm mb-2"><strong>Definition:</strong> {principle.definition}</p>
                        <p className="text-sm text-muted-foreground"><strong>Justification:</strong> {principle.justification}</p>
                      </div>
                    ))}

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold mb-2">Why This Ranking?</h4>
                      <p className="text-sm text-muted-foreground">{brief.foundational_principles.ranking_rationale}</p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Progressive Summaries */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-4">
                Summary
              </h2>

              {/* Reading Level Selector */}
              <div className="mb-6">
                <ReadingLevelSelector
                  level={activeLevel}
                  onLevelChange={handleLevelChange}
                />
              </div>

              {/* Active Summary with fade transition */}
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

            {/* Narrative Analysis */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-4">Narrative Analysis</h2>
              <NarrativeSection
                narrative={brief.narrative}
                sources={brief.sources}
              />
            </section>

            {/* Structured Data Sections */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-6">Structured Analysis</h2>
              <StructuredDataSections
                structuredData={brief.structured_data}
                historicalSummary={brief.historical_summary}
              />
            </section>

            {/* Sources Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <SourcesSection sources={brief.sources as Source[]} />
            </section>

            {/* Feedback Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Clarity Score Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Clarity Score Breakdown</h3>

              <div className="space-y-3">
                {Object.entries(brief.clarity_critique.breakdown as Record<string, number>).map(
                  ([key, value]: [string, number]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-medium">
                          {(value * 10).toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-2">Strengths</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {(brief.clarity_critique.strengths as string[]).map((strength: string, i: number) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Gaps</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {(brief.clarity_critique.gaps as string[]).map((gap: string, i: number) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sources */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4">
                Sources ({brief.sources.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(brief.sources as { id: string; url: string; title: string; author: string; publication_date: string; political_lean: string; source_type: string }[]).map((source, index) => (
                  <a
                    key={source.id}
                    id={`source-${index + 1}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium group-hover:text-primary line-clamp-2">
                        {source.title}
                      </h4>
                      <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{source.author}</span>
                      <span>•</span>
                      <span>
                        {new Date(source.publication_date).getFullYear()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`source-tag ${getPoliticalLeanClass(
                          source.political_lean
                        )}`}
                      >
                        {source.political_lean}
                      </span>
                      <span className="source-tag center">
                        {source.source_type}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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
