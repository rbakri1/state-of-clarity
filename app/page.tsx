"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Sparkles, BookOpen, Eye, Target, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LowBalanceWarning } from "./components/LowBalanceWarning";
import { BriefGenerationProgress } from "@/components/generation/generation-progress";
import { AuthRequiredModal } from "@/components/auth/auth-required-modal";
import type { GenerationStage } from "@/lib/types/brief";
import { EXAMPLE_QUESTIONS } from "@/lib/data/example-questions";
import { SHOWCASE_BRIEFS, type ShowcaseBrief } from "@/lib/data/showcase-briefs";
import { getRotatingFeaturedBriefs, type FeaturedBrief } from "@/lib/data/featured-briefs";

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
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get rotating featured briefs on component mount
  const [featuredBriefs, setFeaturedBriefs] = useState<FeaturedBrief[]>([]);

  const [generationStage, setGenerationStage] = useState<GenerationStage>("research");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(TOTAL_ESTIMATED_TIME / 1000);

  // Rotating example questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionOpacity, setQuestionOpacity] = useState(1);
  const questionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Rotate questions every 4 seconds with fade effect
    questionIntervalRef.current = setInterval(() => {
      // Fade out
      setQuestionOpacity(0);

      // After fade out, change question and fade in
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => (prev + 1) % EXAMPLE_QUESTIONS.length);
        setQuestionOpacity(1);
      }, 300);
    }, 4000);

    return () => {
      if (questionIntervalRef.current) {
        clearInterval(questionIntervalRef.current);
      }
    };
  }, []);

  const currentExampleQuestion = EXAMPLE_QUESTIONS[currentQuestionIndex];

  // Load rotating featured briefs on mount
  useEffect(() => {
    setFeaturedBriefs(getRotatingFeaturedBriefs());
  }, []);

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

  // Check for pending question after auth and auto-submit
  useEffect(() => {
    const pendingQuestion = localStorage.getItem('pendingQuestion');
    const pendingQuestionPath = localStorage.getItem('pendingQuestionPath');

    if (pendingQuestion && pendingQuestionPath === window.location.pathname) {
      // Clear localStorage immediately
      localStorage.removeItem('pendingQuestion');
      localStorage.removeItem('pendingQuestionPath');

      // Set question and auto-submit
      setQuestion(pendingQuestion);

      // Trigger submission automatically
      const autoSubmit = async () => {
        if (pendingQuestion.trim().length < MIN_QUESTION_LENGTH || pendingQuestion.trim().length > MAX_QUESTION_LENGTH) {
          setError(`Question must be between ${MIN_QUESTION_LENGTH} and ${MAX_QUESTION_LENGTH} characters.`);
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
            credentials: "include",
            body: JSON.stringify({ question: pendingQuestion.trim() }),
          });

          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const data = await response.json();
            clearInterval(progressInterval);

            if (!response.ok) {
              if (response.status === 401) {
                setShowAuthModal(true);
                return;
              }
              if (response.status === 402 && data.creditsLink) {
                setError(`${data.error} `);
                setTimeout(() => {
                  window.location.href = data.creditsLink;
                }, 2000);
                return;
              }
              throw new Error(data.error || "Failed to generate brief");
            }
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("Failed to start generation stream");
          }

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                continue;
              }
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.stage === "research") {
                    setGenerationStage("research");
                  } else if (data.stage === "credits_deducted") {
                    setGenerationStage("structure");
                  }

                  if (data.success !== undefined) {
                    clearInterval(progressInterval);
                    setGenerationProgress(100);

                    if (data.success && data.briefId) {
                      window.location.href = `/brief/${data.briefId}`;
                      return;
                    } else if (data.creditRefunded) {
                      setError(data.error || "Brief generation did not meet quality standards. Your credit has been refunded.");
                    } else if (data.error) {
                      setError(data.error);
                    }
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          }

          clearInterval(progressInterval);
        } catch (err) {
          clearInterval(progressInterval);
          setError(err instanceof Error ? err.message : "Failed to generate brief");
        } finally {
          setIsLoading(false);
        }
      };

      autoSubmit();
    }
  }, [startProgressSimulation]);

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
        credentials: "include",
        body: JSON.stringify({ question: question.trim() }),
      });

      // Check for non-streaming error responses (auth, credits, etc.)
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        clearInterval(progressInterval);

        if (!response.ok) {
          if (response.status === 401) {
            // Store question and pathname for auto-submit after auth
            localStorage.setItem('pendingQuestion', question.trim());
            localStorage.setItem('pendingQuestionPath', window.location.pathname);
            setShowAuthModal(true);
            return;
          }
          if (response.status === 402 && data.creditsLink) {
            setError(`${data.error} `);
            setTimeout(() => {
              window.location.href = data.creditsLink;
            }, 2000);
            return;
          }
          throw new Error(data.error || "Failed to generate brief");
        }
        return;
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to start generation stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            continue;
          }
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Update progress based on stage
              if (data.stage === "research") {
                setGenerationStage("research");
              } else if (data.stage === "credits_deducted") {
                setGenerationStage("structure");
              }

              // Handle completion
              if (data.success !== undefined) {
                clearInterval(progressInterval);
                setGenerationProgress(100);
                
                if (data.success && data.briefId) {
                  window.location.href = `/brief/${data.briefId}`;
                  return;
                } else if (data.creditRefunded) {
                  setError(data.error || "Brief generation did not meet quality standards. Your credit has been refunded.");
                } else if (data.error) {
                  setError(data.error);
                }
              }
            } catch {
              // Ignore parse errors for heartbeats etc
            }
          }
        }
      }

      clearInterval(progressInterval);
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

  // Use first 6 showcase briefs (the two original ones plus 4 more)
  const showcaseBriefs = SHOWCASE_BRIEFS.slice(0, 6);

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
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                    <Search className="h-5 w-5 text-ink-400" />
                  </div>
                  <textarea
                    value={question}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_QUESTION_LENGTH + 50) {
                        setQuestion(e.target.value);
                      }
                    }}
                    placeholder="Ask a policy question..."
                    rows={2}
                    className={cn(
                      "w-full pl-12 pr-4 py-4 rounded-xl",
                      "border-2 bg-ivory-50",
                      "text-ink-800 font-body text-base",
                      "placeholder:text-ink-400",
                      "focus:ring-2 focus:ring-sage-500/20 outline-none",
                      "transition-all duration-200",
                      "disabled:bg-ivory-200 disabled:cursor-not-allowed",
                      "resize-none overflow-hidden",
                      "min-h-[56px]",
                      charStatus.status === "too-long" ? "border-error focus:border-error" :
                      charStatus.status === "too-short" && question.length > 0 ? "border-warning focus:border-warning" :
                      "border-ivory-600 focus:border-sage-500"
                    )}
                    disabled={isLoading}
                    maxLength={MAX_QUESTION_LENGTH + 50}
                    aria-describedby="question-hint"
                    style={{
                      height: question.length > 50 ? 'auto' : '56px',
                      minHeight: '56px',
                      maxHeight: '200px',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '56px';
                      target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !question.trim() || charStatus.status === "too-short" || charStatus.status === "too-long"}
                  className={cn(
                    "w-full sm:w-auto",
                    "px-6 py-4 sm:py-0 rounded-xl sm:rounded-lg",
                    "min-h-[48px] sm:h-[56px]",
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
                  {charStatus.message || (question.length === 0 ? (
                    <span>
                      Try asking about a specific policy, e.g.,{" "}
                      <span
                        className="transition-opacity duration-300"
                        style={{ opacity: questionOpacity }}
                      >
                        &apos;{currentExampleQuestion}&apos;
                      </span>
                    </span>
                  ) : "")}
                </span>
                <span className={cn(
                  "tabular-nums transition-colors duration-200 flex-shrink-0 ml-2",
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

          {/* Authentication Required Modal */}
          <AuthRequiredModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            redirectPath="/"
          />

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
              "bg-ivory-200 border border-ivory-400",
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
              "bg-ivory-200 border border-ivory-400",
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
              "bg-ivory-200 border border-ivory-400",
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

      {/* Featured Insights - Rotating Brief Cards */}
      {featuredBriefs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-ivory-500">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-100 text-sage-600 text-sm font-ui font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Featured Insights</span>
            </div>
            <h2 className="text-3xl font-heading font-semibold text-ink-800 mb-3">
              Deep Dives into Today's Biggest Questions
            </h2>
            <p className="font-body text-ink-500 max-w-xl mx-auto">
              Explore high-quality briefs that showcase first-principles reasoning,
              transparent sources, and balanced analysis of complex policy questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {featuredBriefs.map((brief) => (
              <Link
                key={brief.id}
                href={`/brief/${brief.id}`}
                className={cn(
                  "group p-6 rounded-xl",
                  "bg-gradient-to-br from-sage-50 to-ivory-50 border border-sage-200",
                  "hover:border-sage-400 hover:shadow-lg hover:scale-[1.02]",
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
                <h3 className="font-heading font-semibold text-base text-ink-800 mb-3 group-hover:text-sage-600 transition-colors duration-200 leading-snug">
                  {brief.question}
                </h3>

                {/* Excerpt */}
                <p className="text-sm font-body text-ink-600 leading-relaxed mb-4 line-clamp-3">
                  {brief.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {brief.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "px-2 py-0.5 rounded-md",
                        "bg-sage-100 text-sage-700",
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

          <div className="text-center space-y-4">
            <p className="text-sm font-ui text-ink-500">
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              Featured insights change on each visit • More being added daily
            </p>
            <Link
              href="/explore"
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-lg",
                "bg-sage-100 text-sage-700 border border-sage-200",
                "hover:bg-sage-200 hover:border-sage-300",
                "font-ui font-medium text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                "transition-all duration-200"
              )}
            >
              Explore All Briefs
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      )}

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

        {/* See All Briefs Button */}
        <div className="text-center mt-10">
          <Link
            href="/explore"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-lg",
              "bg-sage-100 text-sage-600 font-ui font-medium",
              "hover:bg-sage-200 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            )}
          >
            See All Briefs
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Note: Footer is rendered in layout.tsx */}
    </div>
  );
}
