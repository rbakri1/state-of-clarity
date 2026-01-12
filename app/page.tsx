"use client";

import { useState, useCallback } from "react";
import { Search, Sparkles, BookOpen, Eye, Target, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CreditBalance } from "./components/CreditBalance";
import { LowBalanceWarning } from "./components/LowBalanceWarning";
import { BriefGenerationProgress } from "@/components/generation/generation-progress";
import type { GenerationStage } from "@/lib/types/brief";

const MIN_QUESTION_LENGTH = 10;
const MAX_QUESTION_LENGTH = 500;
const OPTIMAL_MIN_LENGTH = 20;
const OPTIMAL_MAX_LENGTH = 200;

const STAGE_TIMINGS: { stage: GenerationStage; duration: number }[] = [
  { stage: "research", duration: 12000 },
  { stage: "structure", duration: 8000 },
  { stage: "summary", duration: 15000 },
  { stage: "narrative", duration: 10000 },
  { stage: "scoring", duration: 5000 },
];

const TOTAL_ESTIMATED_TIME = STAGE_TIMINGS.reduce((acc, s) => acc + s.duration, 0);

export default function Home() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generationStage, setGenerationStage] = useState<GenerationStage>("research");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(TOTAL_ESTIMATED_TIME / 1000);

  const startProgressSimulation = useCallback(() => {
    let elapsedTime = 0;
    let currentStageIndex = 0;
    let stageElapsed = 0;

    const interval = setInterval(() => {
      elapsedTime += 200;
      stageElapsed += 200;

      const currentStage = STAGE_TIMINGS[currentStageIndex];
      
      if (currentStage && stageElapsed >= currentStage.duration && currentStageIndex < STAGE_TIMINGS.length - 1) {
        currentStageIndex++;
        stageElapsed = 0;
        setGenerationStage(STAGE_TIMINGS[currentStageIndex].stage);
      }

      const progress = Math.min(95, (elapsedTime / TOTAL_ESTIMATED_TIME) * 100);
      setGenerationProgress(progress);
      
      const remaining = Math.max(5, Math.ceil((TOTAL_ESTIMATED_TIME - elapsedTime) / 1000));
      setEstimatedTimeRemaining(remaining);

      if (elapsedTime >= TOTAL_ESTIMATED_TIME) {
        clearInterval(interval);
      }
    }, 200);

    return interval;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    if (question.trim().length < MIN_QUESTION_LENGTH) {
      setError(`Question must be at least ${MIN_QUESTION_LENGTH} characters.`);
      return;
    }
    if (question.trim().length > MAX_QUESTION_LENGTH) {
      setError(`Question must be less than ${MAX_QUESTION_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGenerationStage("research");
    setGenerationProgress(0);
    setEstimatedTimeRemaining(TOTAL_ESTIMATED_TIME / 1000);

    const progressInterval = startProgressSimulation();

    try {
      const response = await fetch("/api/briefs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await response.json();

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!response.ok) {
        if (response.status === 402 && data.creditsLink) {
          setError(`${data.error} `);
          setTimeout(() => {
            window.location.href = data.creditsLink;
          }, 2000);
          return;
        }
        throw new Error(data.error || "Failed to generate brief");
      }

      if (data.success && data.briefId) {
        window.location.href = `/brief/${data.briefId}`;
      } else if (data.creditRefunded) {
        setError(data.error || "Brief generation did not meet quality standards. Your credit has been refunded.");
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Failed to generate brief");
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacterCountStatus = () => {
    const len = question.length;
    if (len === 0) return { status: "empty", message: "" };
    if (len < MIN_QUESTION_LENGTH) return { status: "too-short", message: `${MIN_QUESTION_LENGTH - len} more characters needed` };
    if (len > MAX_QUESTION_LENGTH) return { status: "too-long", message: `${len - MAX_QUESTION_LENGTH} characters over limit` };
    if (len >= OPTIMAL_MIN_LENGTH && len <= OPTIMAL_MAX_LENGTH) return { status: "optimal", message: "Good length for a policy question" };
    return { status: "acceptable", message: "" };
  };

  const charStatus = getCharacterCountStatus();

  const showcaseBriefs = [
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
      question: "Can the UK realistically achieve Net Zero by 2050?",
      clarity_score: 7.9,
      tags: ["Climate", "Energy", "Economics"],
      readTime: "7 min",
    },
  ];

  const getClarityScoreStyles = (score: number) => {
    if (score >= 8.5) {
      return "bg-success-light text-success-dark";
    } else if (score >= 7) {
      return "bg-warning-light text-warning-dark";
    }
    return "bg-error-light text-error-dark";
  };

  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Low Balance Warning */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <LowBalanceWarning />
      </div>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-100 text-sage-600 text-sm font-ui font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Evidence-Based Policy Analysis</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-semibold text-ink-800 tracking-tight leading-tight">
            See politics clearly.
            <br />
            <span className="text-sage-500">Decide wisely.</span>
          </h1>

          {/* Subheadline - matches brand voice: rigorous, transparent, depth over speed */}
          <p className="text-xl font-body text-ink-600 max-w-2xl mx-auto leading-relaxed">
            Transform any political question into an evidence-rich policy brief 
            with transparent sources, four reading levels, and first-principles reasoning.
          </p>

          {/* Ask Anything Interface */}
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="max-w-2xl mx-auto space-y-3">
              {/* Mobile: stacked input and button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-ink-400" />
                  </div>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_QUESTION_LENGTH + 50) {
                        setQuestion(e.target.value);
                      }
                    }}
                    placeholder="Ask a policy question..."
                    className={cn(
                      "w-full pl-12 pr-4 py-4 rounded-xl",
                      "border-2 bg-ivory-50",
                      "text-ink-800 font-body text-base",
                      "placeholder:text-ink-400",
                      "focus:ring-2 focus:ring-sage-500/20 outline-none",
                      "transition-all duration-200",
                      "disabled:bg-ivory-200 disabled:cursor-not-allowed",
                      charStatus.status === "too-long" ? "border-error focus:border-error" :
                      charStatus.status === "too-short" && question.length > 0 ? "border-warning focus:border-warning" :
                      "border-ivory-600 focus:border-sage-500"
                    )}
                    disabled={isLoading}
                    maxLength={MAX_QUESTION_LENGTH + 50}
                    aria-describedby="question-hint"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !question.trim() || charStatus.status === "too-short" || charStatus.status === "too-long"}
                  className={cn(
                    "w-full sm:w-auto",
                    "px-6 py-4 sm:py-2.5 rounded-xl sm:rounded-lg",
                    "min-h-[48px]",
                    "bg-sage-500 text-ivory-100 font-ui font-medium",
                    "hover:bg-sage-600 transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                    "disabled:bg-ivory-400 disabled:text-ink-400 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? "Generating..." : "Get Brief"}
                </button>
              </div>

              {/* Character Count & Hint */}
              <div id="question-hint" className="flex items-center justify-between text-sm font-ui">
                <span className={cn(
                  "transition-colors duration-200",
                  charStatus.status === "optimal" && "text-success",
                  charStatus.status === "too-short" && question.length > 0 && "text-warning",
                  charStatus.status === "too-long" && "text-error",
                  charStatus.status === "acceptable" && "text-ink-500",
                  charStatus.status === "empty" && "text-ink-400"
                )}>
                  {charStatus.message || (question.length === 0 ? "Try asking about a specific policy, e.g., 'Should the UK raise the minimum wage?'" : "")}
                </span>
                <span className={cn(
                  "tabular-nums transition-colors duration-200",
                  charStatus.status === "too-long" && "text-error font-medium",
                  charStatus.status === "too-short" && question.length > 0 && "text-warning",
                  charStatus.status !== "too-long" && charStatus.status !== "too-short" && "text-ink-400"
                )}>
                  {question.length}/{MAX_QUESTION_LENGTH}
                </span>
              </div>
            </div>
          </form>

          {/* Generation Progress Overlay */}
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm">
              <BriefGenerationProgress
                currentStage={generationStage}
                progress={generationProgress}
                estimatedSecondsRemaining={estimatedTimeRemaining}
                className="shadow-xl"
              />
            </div>
          )}

          {/* Error Message */}
          {error && !isLoading && (
            <div className={cn(
              "mt-4 max-w-2xl mx-auto p-4 rounded-lg",
              "bg-error-light border border-error text-error-dark",
              "font-ui text-sm"
            )}>
              {error}
              {error.includes("credits") && (
                <Link 
                  href="/credits" 
                  className="ml-1 underline hover:no-underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 rounded"
                >
                  Buy credits →
                </Link>
              )}
            </div>
          )}

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {/* Progressive Summaries */}
            <div className={cn(
              "p-6 rounded-xl",
              "bg-ivory-500 border border-ivory-600",
              "text-left transition-all duration-200"
            )}>
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-sage-600" />
              </div>
              <h3 className="font-heading font-semibold text-ink-800 mb-2">
                Progressive Summaries
              </h3>
              <p className="text-sm font-body text-ink-500 leading-relaxed">
                Four reading levels from ages 8 to PhD. We meet you where you are – 
                no condescension, no gatekeeping.
              </p>
            </div>

            {/* Transparent Sources */}
            <div className={cn(
              "p-6 rounded-xl",
              "bg-ivory-500 border border-ivory-600",
              "text-left transition-all duration-200"
            )}>
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <Eye className="w-5 h-5 text-sage-600" />
              </div>
              <h3 className="font-heading font-semibold text-ink-800 mb-2">
                Transparent Sources
              </h3>
              <p className="text-sm font-body text-ink-500 leading-relaxed">
                We link every claim to its source. You see credibility scores and 
                political lean – verify for yourself.
              </p>
            </div>

            {/* Clarity Score */}
            <div className={cn(
              "p-6 rounded-xl",
              "bg-ivory-500 border border-ivory-600",
              "text-left transition-all duration-200"
            )}>
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-sage-600" />
              </div>
              <h3 className="font-heading font-semibold text-ink-800 mb-2">
                Clarity Score
              </h3>
              <p className="text-sm font-body text-ink-500 leading-relaxed">
                Every brief scores itself for bias, gaps, and coherence. We show 
                our reasoning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Briefs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-ivory-500">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-semibold text-ink-800 mb-3">
            See Evidence-Based Analysis in Action
          </h2>
          <p className="font-body text-ink-500 max-w-xl mx-auto">
            These briefs show how we build reasoning from first principles – 
            with full source transparency and layered complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showcaseBriefs.map((brief) => (
            <Link
              key={brief.id}
              href={`/brief/${brief.id}`}
              className={cn(
                "group p-6 rounded-xl",
                "bg-ivory-50 border border-ivory-600",
                "hover:border-sage-400 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                "transition-all duration-200"
              )}
            >
              {/* Score and Read Time */}
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                  "text-sm font-ui font-medium",
                  getClarityScoreStyles(brief.clarity_score)
                )}>
                  <Target className="w-3.5 h-3.5" />
                  <span>{brief.clarity_score}/10</span>
                </div>
                <div className="inline-flex items-center gap-1 text-ink-400 font-ui text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{brief.readTime}</span>
                </div>
              </div>

              {/* Question */}
              <h3 className="font-heading font-semibold text-lg text-ink-800 mb-3 group-hover:text-sage-600 transition-colors duration-200 leading-snug">
                {brief.question}
              </h3>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {brief.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "px-2.5 py-1 rounded-md",
                      "bg-ivory-300 text-ink-500",
                      "text-xs font-ui font-medium"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Note: Footer is rendered in layout.tsx */}
    </div>
  );
}
