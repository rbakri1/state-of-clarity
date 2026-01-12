"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Share2,
  BookmarkPlus,
  AlertCircle,
  Info,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { ReadingLevelSelector } from "@/components/brief/reading-level-selector";
import { SummaryCard } from "@/components/brief/summary-card";
import { PoliticalLeanBadge } from "@/components/sources/political-lean-badge";
import { CredibilityBadge } from "@/components/sources/credibility-badge";
import type { ReadingLevel, PoliticalLean } from "@/lib/types/brief";
import { cn } from "@/lib/utils";

import briefUK4Day from "@/sample-briefs/uk-four-day-week.json";
import briefWhatIsState from "@/sample-briefs/what-is-a-state.json";
import { LowBalanceWarning } from "@/app/components/LowBalanceWarning";

export default function BriefPage() {
  const params = useParams();
  const [activeLevel, setActiveLevel] = useState<ReadingLevel>("undergrad");
  const [showClarityBreakdown, setShowClarityBreakdown] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    posit: true,
    definitions: true,
    factors: true,
    policies: false,
    consequences: false,
    historical: false,
    principles: false,
  });

  // Fetch brief from API
  useEffect(() => {
    const fetchBrief = async () => {
      const id = params.id as string;

      // Check for hardcoded sample briefs first
      const sampleBriefs: { [key: string]: any } = {
        "uk-four-day-week": briefUK4Day,
        "what-is-a-state": briefWhatIsState,
      };

      if (sampleBriefs[id]) {
        setBrief(sampleBriefs[id]);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      try {
        const response = await fetch(`/api/briefs/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || "Failed to load brief");
          setIsLoading(false);
          return;
        }

        setBrief(data.brief);
        setIsLoading(false);
      } catch (err) {
        console.error('[Brief Page] Error fetching brief:', err);
        setError("Failed to load brief");
        setIsLoading(false);
      }
    };

    fetchBrief();
  }, [params.id]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sage-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
            <span className="text-lg font-ui">Loading brief...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show 404 if brief not found
  if (!brief || error) {
    return (
      <div className="min-h-screen bg-ivory-100 flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <span className="text-8xl font-heading font-bold text-ivory-500">404</span>
            </div>
            <h1 className="text-2xl font-heading font-semibold text-ink-800 mb-4">
              Brief not found
            </h1>
            <p className="text-ink-500 font-ui text-base mb-8">
              This brief doesn&apos;t exist or may have been removed. Try asking a new question to generate a fresh brief.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-sage-500 text-ivory-100 font-ui font-medium hover:bg-sage-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                Go to homepage
              </Link>
              <Link
                href="/ask"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-ivory-600 bg-ivory-50 text-ink-800 font-ui font-medium hover:bg-ivory-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                Ask a question
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getClarityScoreClass = (score: number | null | undefined) => {
    const s = typeof score === 'number' ? score : 0;
    if (s >= 80 || s >= 8) return "bg-success-light text-success-dark";
    if (s >= 60 || s >= 6) return "bg-warning-light text-warning-dark";
    return "bg-error-light text-error-dark";
  };
  
  // Normalize clarity score (could be 0-100 or 0-10)
  const getDisplayScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "N/A";
    if (score > 10) return (score / 10).toFixed(1);
    return score.toFixed ? score.toFixed(1) : score;
  };

  const normalizePolicalLean = (lean: string): PoliticalLean => {
    const normalized = lean.toLowerCase().replace(/\s+/g, "-");
    const validLeans: PoliticalLean[] = [
      "left",
      "center-left",
      "center",
      "center-right",
      "right",
      "unknown",
    ];
    return validLeans.includes(normalized as PoliticalLean)
      ? (normalized as PoliticalLean)
      : "unknown";
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: brief.question,
          text: `Check out this policy brief on State of Clarity`,
          url: window.location.href,
        });
      } catch {
        await navigator.clipboard.writeText(window.location.href);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-ink-500 hover:text-ink-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-ivory-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              title="Share this brief"
              aria-label="Share this brief"
            >
              <Share2 className="w-5 h-5 text-ink-600" />
            </button>
            <button
              className="p-2 hover:bg-ivory-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              title="Save this brief"
              aria-label="Save this brief"
            >
              <BookmarkPlus className="w-5 h-5 text-ink-600" />
            </button>
            <Link
              href="/ask"
              className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-sage-500 text-ivory-100 font-ui font-medium hover:bg-sage-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            >
              Ask Follow-up
            </Link>
          </div>
        </div>
        {/* Low Balance Warning */}
        <LowBalanceWarning className="mb-6" />

        {/* Brief Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-ink-800 max-w-prose">
              {brief.question}
            </h1>
            
            {/* Clarity Score Badge */}
            <button
              onClick={() => setShowClarityBreakdown(!showClarityBreakdown)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-ui font-medium transition-all",
                getClarityScoreClass(brief.clarity_score),
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                "hover:shadow-md cursor-pointer"
              )}
              aria-expanded={showClarityBreakdown}
              aria-label={`Clarity Score: ${getDisplayScore(brief.clarity_score)}/10. Click to ${showClarityBreakdown ? "hide" : "show"} breakdown`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{getDisplayScore(brief.clarity_score)}/10</span>
              {showClarityBreakdown ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-ink-500 font-ui">
            <span>
              Version {brief.version} • Updated{" "}
              {new Date(brief.updated_at).toLocaleDateString()}
            </span>
            <span>•</span>
            <span>{brief.sources?.length || 0} sources</span>
            {brief.metadata?.tags?.length > 0 && (
              <>
                <span>•</span>
                <div className="flex flex-wrap gap-2">
                  {brief.metadata.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-md bg-ivory-300 text-ink-600 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2 space-y-8">
            {/* Executive Summary - Adaptive Reading Levels */}
            <section className="bg-sage-50 rounded-xl border-2 border-sage-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-bold font-heading text-ink-800 mb-1">
                    Executive Summary
                  </h2>
                  <p className="text-sm text-ink-600 font-body">
                    Choose your preferred complexity level for this overview. The detailed analysis below remains consistent for all readers.
                  </p>
                </div>
              </div>

              {/* Reading Level Selector */}
              <ReadingLevelSelector
                currentLevel={activeLevel}
                onLevelChange={setActiveLevel}
                className="mb-6"
              />

              {/* Summary Cards for each level */}
              <div className="relative">
                {(["child", "teen", "undergrad", "postdoc"] as const).map(
                  (level) => (
                    <SummaryCard
                      key={level}
                      level={level}
                      content={brief.summaries?.[level] || ""}
                      isActive={activeLevel === level}
                    />
                  )
                )}
              </div>
            </section>

            {/* POSIT (if present) */}
            {brief.posit && (
              <section className="bg-ivory-200 rounded-xl border border-ivory-600 p-6">
                <button
                  onClick={() => toggleSection("posit")}
                  className="flex items-center justify-between w-full text-left mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
                >
                  <h2 className="text-xl font-bold font-heading text-ink-800">POSIT</h2>
                  {expandedSections.posit ? (
                    <ChevronUp className="w-5 h-5 text-ink-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ink-600" />
                  )}
                </button>

                {expandedSections.posit && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sage-600 mb-2 font-ui">
                        Question:
                      </h3>
                      <p className="text-base text-ink-800 font-body">
                        {brief.posit.question}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sage-600 mb-2 font-ui">
                        Relevance:
                      </h3>
                      <p className="text-base text-ink-600 font-body">
                        {brief.posit.relevance}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Historical Summary (if present) */}
            {brief.historical_summary && (
              <section className="bg-ivory-200 rounded-xl border border-ivory-600 p-6">
                <button
                  onClick={() => toggleSection("historical")}
                  className="flex items-center justify-between w-full text-left mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
                >
                  <h2 className="text-xl font-bold font-heading text-ink-800">
                    Historical Summary
                  </h2>
                  {expandedSections.historical ? (
                    <ChevronUp className="w-5 h-5 text-ink-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ink-600" />
                  )}
                </button>

                {expandedSections.historical && (
                  <div className="prose prose-custom max-w-prose space-y-4">
                    <p className="text-sm italic text-ink-500">
                      {brief.historical_summary.introduction}
                    </p>

                    <div>
                      <h3 className="font-semibold mb-2 font-ui text-ink-800">
                        Origins and Early Development
                      </h3>
                      <p className="text-sm text-ink-600 font-body">
                        {brief.historical_summary.origins}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 font-ui text-ink-800">
                        Key Milestones
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-ink-600 font-body">
                        {brief.historical_summary.key_milestones.map(
                          (milestone: string, i: number) => (
                            <li key={i}>{milestone}</li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 font-ui text-ink-800">
                        Modern Context
                      </h3>
                      <p className="text-sm text-ink-600 font-body">
                        {brief.historical_summary.modern_context}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 font-ui text-ink-800">
                        Lessons from the Past
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-ink-600 font-body">
                        {brief.historical_summary.lessons.map(
                          (lesson: string, i: number) => (
                            <li key={i}>{lesson}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Foundational Principles (if present) */}
            {brief.foundational_principles?.enabled && (
              <section className="bg-ivory-200 rounded-xl border border-ivory-600 p-6">
                <button
                  onClick={() => toggleSection("principles")}
                  className="flex items-center justify-between w-full text-left mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
                >
                  <h2 className="text-xl font-bold font-heading text-ink-800">
                    Foundational Principles
                  </h2>
                  {expandedSections.principles ? (
                    <ChevronUp className="w-5 h-5 text-ink-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ink-600" />
                  )}
                </button>

                {expandedSections.principles && (
                  <div className="space-y-4">
                    <p className="text-sm italic text-ink-500 mb-4 font-body">
                      These principles guide our analysis, force-ranked by
                      importance:
                    </p>

                    {brief.foundational_principles.principles.map(
                      (principle: any) => (
                        <div
                          key={principle.rank}
                          className="p-4 bg-ivory-100 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold font-ui text-ink-800">
                              {principle.rank}. {principle.name}
                            </h3>
                          </div>
                          <p className="text-sm mb-2 font-body text-ink-700">
                            <strong>Definition:</strong> {principle.definition}
                          </p>
                          <p className="text-sm text-ink-600 font-body">
                            <strong>Justification:</strong>{" "}
                            {principle.justification}
                          </p>
                        </div>
                      )
                    )}

                    <div className="p-4 bg-sage-50 rounded-lg border border-sage-200">
                      <h4 className="font-semibold mb-2 font-ui text-ink-800">
                        Why This Ranking?
                      </h4>
                      <p className="text-sm text-ink-600 font-body">
                        {brief.foundational_principles.ranking_rationale}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Narrative Analysis */}
            {brief.narrative && (
              <section className="bg-ivory-200 rounded-xl border border-ivory-600 p-6">
                <h2 className="text-xl font-bold font-heading text-ink-800 mb-4">
                  Narrative Analysis
                </h2>
                <div className="prose prose-custom max-w-prose">
                  {brief.narrative
                    .split("\n\n")
                    .map((paragraph: string, i: number) => (
                      <p
                        key={i}
                        className="mb-4 text-base leading-relaxed text-ink-800 font-body"
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              </section>
            )}

            {/* Structured Data */}
            {brief.structured_data && (
              <section className="bg-ivory-200 rounded-xl border border-ivory-600 p-6">
                <h2 className="text-xl font-bold font-heading text-ink-800 mb-6">
                  Structured Analysis
                </h2>

                {/* Definitions */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection("definitions")}
                    className="flex items-center justify-between w-full text-left mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
                  >
                    <h3 className="text-lg font-semibold font-ui text-ink-800">
                      Key Definitions ({brief.structured_data.definitions?.length || 0})
                    </h3>
                  {expandedSections.definitions ? (
                    <ChevronUp className="w-5 h-5 text-ink-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ink-600" />
                  )}
                </button>

                {expandedSections.definitions && (
                  <div className="space-y-3">
                    {(brief.structured_data.definitions || []).map(
                      (def: any, i: number) => (
                        <div key={i} className="p-4 bg-ivory-100 rounded-lg">
                          <dt className="font-semibold text-sage-600 mb-2 font-ui">
                            {def.term}
                          </dt>
                          <dd className="text-sm mb-2 text-ink-700 font-body">
                            {def.definition}
                          </dd>
                          {def.source && (
                            <dd className="text-xs text-ink-500 mb-2 font-ui">
                              <strong>Source:</strong> {def.source}
                            </dd>
                          )}
                          {def.points_of_contention && (
                            <dd className="text-xs text-rust-600 font-ui">
                              <strong>⚠ Points of Contention:</strong>{" "}
                              {def.points_of_contention}
                            </dd>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Factors */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("factors")}
                  className="flex items-center justify-between w-full text-left mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
                >
                  <h3 className="text-lg font-semibold font-ui text-ink-800">
                    Key Factors ({brief.structured_data.factors?.length || 0})
                  </h3>
                  {expandedSections.factors ? (
                    <ChevronUp className="w-5 h-5 text-ink-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ink-600" />
                  )}
                </button>

                {expandedSections.factors && (
                  <div className="space-y-4">
                    {(brief.structured_data.factors || []).map(
                      (factor: any, i: number) => (
                        <div key={i} className="p-4 bg-ivory-100 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold font-ui text-ink-800">
                              {factor.name}
                            </h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-sage-100 text-sage-700 font-ui">
                              {factor.impact}
                            </span>
                          </div>
                          {factor.evidence && factor.evidence.length > 0 && (
                            <div className="text-sm text-ink-600 mb-2 font-body">
                              <strong className="font-ui">Evidence:</strong>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                {factor.evidence.map((ev: any, j: number) => (
                                  <li key={j}>{ev}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Policies */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("policies")}
                  className="flex items-center justify-between w-full text-left mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
                >
                  <h3 className="text-lg font-semibold font-ui text-ink-800">
                    Policy Options ({brief.structured_data.policies?.length || 0})
                  </h3>
                  {expandedSections.policies ? (
                    <ChevronUp className="w-5 h-5 text-ink-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ink-600" />
                  )}
                </button>

                {expandedSections.policies && (
                  <div className="space-y-4">
                    {(brief.structured_data.policies || []).map(
                      (policy: any, i: number) => (
                        <div key={i} className="p-4 bg-ivory-100 rounded-lg">
                          <h4 className="font-semibold mb-3 font-ui text-ink-800">
                            {policy.name}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body">
                            {policy.pros && policy.pros.length > 0 && (
                              <div>
                                <div className="font-medium text-success-dark mb-2 font-ui">
                                  Pros:
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-ink-600">
                                  {policy.pros.map((pro: any, j: number) => (
                                    <li key={j}>{pro}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {policy.cons && policy.cons.length > 0 && (
                              <div>
                                <div className="font-medium text-error-dark mb-2 font-ui">
                                  Cons:
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-ink-600">
                                  {policy.cons.map((con: any, j: number) => (
                                    <li key={j}>{con}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Consequences */}
              <div>
                <button
                  onClick={() => toggleSection("consequences")}
                  className="flex items-center justify-between w-full text-left mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
                >
                  <h3 className="text-lg font-semibold font-ui text-ink-800">
                    Second-Order Effects (
                    {brief.structured_data.consequences?.length || 0})
                  </h3>
                  {expandedSections.consequences ? (
                    <ChevronUp className="w-5 h-5 text-ink-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ink-600" />
                  )}
                </button>

                {expandedSections.consequences && (
                  <div className="space-y-4">
                    {(brief.structured_data.consequences || []).map(
                      (consequence: any, i: number) => (
                        <div key={i} className="p-4 bg-ivory-100 rounded-lg">
                          <h4 className="font-semibold mb-3 font-ui text-ink-800">
                            {consequence.action}
                          </h4>
                          <div className="space-y-2 text-sm font-body">
                            <div>
                              <span className="font-medium font-ui text-ink-700">
                                First-order:
                              </span>{" "}
                              <span className="text-ink-600">
                                {consequence.first_order}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium font-ui text-ink-700">
                                Second-order:
                              </span>{" "}
                              <span className="text-ink-600">
                                {consequence.second_order}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>
            )}

            {/* Feedback Section */}
            <section className="bg-ivory-200 rounded-xl border border-ivory-600 p-6">
              <h2 className="text-xl font-bold font-heading text-ink-800 mb-4">
                Help Us Improve
              </h2>
              <p className="text-sm text-ink-600 mb-4 font-body">
                Spotted an error or know a source we missed? Collaborative 
                truth-seeking works best when you challenge our work.
              </p>

              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 font-ui text-ink-700">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">Helpful</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 font-ui text-ink-700">
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm">Not Helpful</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 font-ui text-ink-700">
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">Suggest Source</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 font-ui text-ink-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Spot Error</span>
                </button>
              </div>
            </section>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Clarity Score Breakdown (expandable) */}
            {showClarityBreakdown && brief.clarity_critique && (
              <div className="bg-ivory-200 rounded-xl border border-ivory-600 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold font-ui text-ink-800">
                    Clarity Score Breakdown
                  </h3>
                  <button
                    onClick={() => setShowClarityBreakdown(false)}
                    className="text-ink-500 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
                    aria-label="Close breakdown"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {brief.clarity_critique?.breakdown && Object.entries(brief.clarity_critique.breakdown).map(
                    ([key, value]) => {
                      // Normalize value: if > 10, it's on 0-100 scale, convert to 0-10
                      const numVal = typeof value === 'number' ? value : 0;
                      const displayVal = numVal > 10 ? numVal / 10 : numVal;
                      const percentVal = numVal > 10 ? numVal : numVal * 100;
                      
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm capitalize text-ink-600 font-ui">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm font-medium text-ink-800 font-ui">
                              {displayVal.toFixed(1)}
                            </span>
                          </div>
                          <div className="w-full bg-ivory-400 rounded-full h-2">
                            <div
                              className="bg-sage-500 rounded-full h-2 transition-all"
                              style={{ width: `${Math.min(percentVal, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Show strengths if available, or notes as fallback */}
                {(brief.clarity_critique.strengths?.length > 0 || brief.clarity_critique.notes?.length > 0) && (
                  <div className="mt-6 pt-6 border-t border-ivory-600">
                    <h4 className="font-medium mb-2 font-ui text-ink-800">
                      {brief.clarity_critique.strengths ? "Strengths" : "Analysis Notes"}
                    </h4>
                    <ul className="text-sm text-ink-600 space-y-1 list-disc list-inside font-body">
                      {(brief.clarity_critique.strengths || brief.clarity_critique.notes || []).map(
                        (item: any, i: number) => (
                          <li key={i}>{item}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {brief.clarity_critique.gaps?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2 font-ui text-ink-800">Gaps</h4>
                    <ul className="text-sm text-ink-600 space-y-1 list-disc list-inside font-body">
                      {brief.clarity_critique.gaps.map((gap: any, i: number) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 p-3 bg-ivory-100 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-sage-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-ink-600 font-body">
                      We score each brief on source diversity, evidence quality, 
                      logical completeness, and accessibility. The Clarity Score 
                      shows how transparent and well-supported the analysis is – 
                      not which position is &quot;correct.&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sources Section */}
            <div
              id="sources-section"
              className="bg-ivory-200 rounded-xl border border-ivory-600 p-6 sticky top-24"
            >
              <h3 className="font-semibold mb-2 font-ui text-ink-800">
                Sources ({brief.sources?.length || 0})
              </h3>
              <p className="text-xs text-ink-500 font-ui mb-4">
                We show credibility scores and political lean – verify for yourself.
              </p>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {(brief.sources || []).map((source: any, index: number) => (
                  <a
                    key={source.id}
                    id={`source-${source.id}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-ivory-100 rounded-lg hover:bg-ivory-300 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-ink-500 font-ui shrink-0">
                          [{index + 1}]
                        </span>
                        <h4 className="text-sm font-medium group-hover:text-sage-600 line-clamp-2 text-ink-800 font-ui">
                          {source.title}
                        </h4>
                      </div>
                      <ExternalLink className="w-3 h-3 shrink-0 text-ink-500" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500 mb-2 font-ui pl-6">
                      {source.author && <span>{source.author}</span>}
                      {source.author && source.publication_date && <span>•</span>}
                      {source.publication_date && (
                        <span>
                          {new Date(source.publication_date).getFullYear()}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pl-6">
                      <PoliticalLeanBadge
                        lean={normalizePolicalLean(source.political_lean)}
                        size="sm"
                      />
                      <CredibilityBadge
                        score={source.credibility_score}
                        size="sm"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
