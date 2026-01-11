"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";

// Import sample briefs (in production, this would come from API)
import briefUK4Day from "@/sample-briefs/uk-four-day-week.json";
import briefWhatIsState from "@/sample-briefs/what-is-a-state.json";

type ReadingLevel = "child" | "teen" | "undergrad" | "postdoc";
type ProfileReadingLevel = "simple" | "standard" | "advanced";

const READING_LEVEL_STORAGE_KEY = "preferred_reading_level";

function mapProfileLevelToReadingLevel(
  profileLevel: ProfileReadingLevel
): ReadingLevel {
  switch (profileLevel) {
    case "simple":
      return "child";
    case "advanced":
      return "postdoc";
    case "standard":
    default:
      return "undergrad";
  }
}

function mapUrlParamToReadingLevel(param: string | null): ReadingLevel | null {
  if (!param) return null;
  const validLevels: ReadingLevel[] = ["child", "teen", "undergrad", "postdoc"];
  if (validLevels.includes(param as ReadingLevel)) {
    return param as ReadingLevel;
  }
  return null;
}

export default function BriefPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [activeLevel, setActiveLevel] = useState<ReadingLevel>("undergrad");
  const [isLoadingLevel, setIsLoadingLevel] = useState(true);

  useEffect(() => {
    async function determineReadingLevel() {
      const urlLevel = mapUrlParamToReadingLevel(searchParams.get("level"));
      if (urlLevel) {
        setActiveLevel(urlLevel);
        setIsLoadingLevel(false);
        return;
      }

      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("preferred_reading_level")
          .eq("id", user.id)
          .single();

        const profile = profileData as {
          preferred_reading_level: string | null;
        } | null;

        if (profile?.preferred_reading_level) {
          const mappedLevel = mapProfileLevelToReadingLevel(
            profile.preferred_reading_level as ProfileReadingLevel
          );
          setActiveLevel(mappedLevel);
          setIsLoadingLevel(false);
          return;
        }
      }

      const storedLevel = localStorage.getItem(READING_LEVEL_STORAGE_KEY);
      if (storedLevel) {
        const parsedLevel = mapUrlParamToReadingLevel(storedLevel);
        if (parsedLevel) {
          setActiveLevel(parsedLevel);
          setIsLoadingLevel(false);
          return;
        }
      }

      setActiveLevel("undergrad");
      setIsLoadingLevel(false);
    }

    determineReadingLevel();
  }, [searchParams]);

  const handleLevelChange = (level: ReadingLevel) => {
    setActiveLevel(level);
    localStorage.setItem(READING_LEVEL_STORAGE_KEY, level);
  };
  const [expandedSections, setExpandedSections] = useState({
    posit: true,
    definitions: true,
    factors: true,
    policies: false,
    consequences: false,
    historical: false,
    principles: false,
  });

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

  const readingLevels = [
    { key: "child" as const, label: "Child", age: "8-12" },
    { key: "teen" as const, label: "Teen", age: "13-17" },
    { key: "undergrad" as const, label: "Undergrad", age: "18-22" },
    { key: "postdoc" as const, label: "Post-doc", age: "Graduate" },
  ];

  const getClarityScoreClass = (score: number) => {
    if (score >= 8) return "high";
    if (score >= 6) return "medium";
    return "low";
  };

  const getPoliticalLeanClass = (lean: string) => {
    if (lean.includes("left")) return "left";
    if (lean.includes("right")) return "right";
    return "center";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
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
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <BookmarkPlus className="w-5 h-5" />
              </button>
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition">
                Ask Follow-up
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Brief Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold">{brief.question}</h1>
            <div
              className={`clarity-score-badge ${getClarityScoreClass(
                brief.clarity_score
              )} shrink-0`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{brief.clarity_score}/10</span>
            </div>
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

            {/* Historical Summary (if present) */}
            {brief.historical_summary && (
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <button
                  onClick={() => toggleSection("historical")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <h2 className="text-xl font-bold">Historical Summary</h2>
                  {expandedSections.historical ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {expandedSections.historical && (
                  <div className="prose prose-clarity max-w-none space-y-4">
                    <p className="text-sm italic text-muted-foreground">
                      {brief.historical_summary.introduction}
                    </p>

                    <div>
                      <h3 className="font-semibold mb-2">Origins and Early Development</h3>
                      <p className="text-sm text-muted-foreground">{brief.historical_summary.origins}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Key Milestones</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {brief.historical_summary.key_milestones.map((milestone: string, i: number) => (
                          <li key={i}>{milestone}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Modern Context</h3>
                      <p className="text-sm text-muted-foreground">{brief.historical_summary.modern_context}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Lessons from the Past</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {brief.historical_summary.lessons.map((lesson: string, i: number) => (
                          <li key={i}>{lesson}</li>
                        ))}
                      </ul>
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
                Progressive Summaries
              </h2>

              {/* Reading Level Selector */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {readingLevels.map((level) => (
                  <button
                    key={level.key}
                    onClick={() => handleLevelChange(level.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                      activeLevel === level.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <div className="text-sm">{level.label}</div>
                    <div className="text-xs opacity-75">{level.age}</div>
                  </button>
                ))}
              </div>

              {/* Active Summary */}
              <div className="prose prose-clarity max-w-none">
                <p className="text-base leading-relaxed">
                  {brief.summaries[activeLevel]}
                </p>
              </div>
            </section>

            {/* Narrative Analysis */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-4">Narrative Analysis</h2>
              <div className="prose prose-clarity max-w-none">
                {brief.narrative.split("\n\n").map((paragraph: string, i: number) => (
                  <p key={i} className="mb-4 text-base leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            {/* Structured Data */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-6">Structured Analysis</h2>

              {/* Definitions */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("definitions")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <h3 className="text-lg font-semibold">
                    Key Definitions ({brief.structured_data.definitions.length})
                  </h3>
                  {expandedSections.definitions ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {expandedSections.definitions && (
                  <div className="space-y-3">
                    {brief.structured_data.definitions.map((def: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <dt className="font-semibold text-primary mb-2">
                          {def.term}
                        </dt>
                        <dd className="text-sm mb-2">
                          {def.definition}
                        </dd>
                        {def.source && (
                          <dd className="text-xs text-muted-foreground mb-2">
                            <strong>Source:</strong> {def.source}
                          </dd>
                        )}
                        {def.points_of_contention && (
                          <dd className="text-xs text-orange-600 dark:text-orange-400">
                            <strong>⚠ Points of Contention:</strong> {def.points_of_contention}
                          </dd>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Factors */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("factors")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <h3 className="text-lg font-semibold">
                    Key Factors ({brief.structured_data.factors.length})
                  </h3>
                  {expandedSections.factors ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {expandedSections.factors && (
                  <div className="space-y-4">
                    {brief.structured_data.factors.map((factor: { name: string; impact: string; evidence: string[] }, i: number) => (
                      <div
                        key={i}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{factor.name}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {factor.impact}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          <strong>Evidence:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {factor.evidence.map((ev: string, j: number) => (
                              <li key={j}>{ev}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Policies */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("policies")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <h3 className="text-lg font-semibold">
                    Policy Options ({brief.structured_data.policies.length})
                  </h3>
                  {expandedSections.policies ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {expandedSections.policies && (
                  <div className="space-y-4">
                    {brief.structured_data.policies.map((policy: { name: string; pros: string[]; cons: string[] }, i: number) => (
                      <div
                        key={i}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <h4 className="font-semibold mb-3">{policy.name}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-green-600 dark:text-green-400 mb-2">
                              Pros:
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {policy.pros.map((pro: string, j: number) => (
                                <li key={j}>{pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="font-medium text-red-600 dark:text-red-400 mb-2">
                              Cons:
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {policy.cons.map((con: string, j: number) => (
                                <li key={j}>{con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consequences */}
              <div>
                <button
                  onClick={() => toggleSection("consequences")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <h3 className="text-lg font-semibold">
                    Second-Order Effects (
                    {brief.structured_data.consequences.length})
                  </h3>
                  {expandedSections.consequences ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {expandedSections.consequences && (
                  <div className="space-y-4">
                    {brief.structured_data.consequences.map((consequence: { action: string; first_order: string; second_order: string }, i: number) => (
                      <div
                        key={i}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <h4 className="font-semibold mb-3">
                          {consequence.action}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">
                              First-order:
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {consequence.first_order}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">
                              Second-order:
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {consequence.second_order}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                  ([key, value]) => (
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
                  {brief.clarity_critique.strengths.map((strength: string, i: number) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Gaps</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {brief.clarity_critique.gaps.map((gap: string, i: number) => (
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
                {brief.sources.map((source: { id: string; url: string; title: string; author: string; publication_date: string; political_lean: string; source_type: string }) => (
                  <a
                    key={source.id}
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
    </div>
  );
}
