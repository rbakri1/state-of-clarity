"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Search, Sparkles, ArrowLeft, Loader2, Wand2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatQuestionTitle, wouldFormatChange } from "@/lib/text-formatting";
import { BriefGenerationProgress } from "@/components/generation/generation-progress";
import { AuthRequiredModal } from "@/components/auth/auth-required-modal";
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

// Large pool of zeitgeist-aware questions for UK and USA
const QUESTION_POOL = [
  // UK Politics & Society
  "Should the UK rejoin the EU?",
  "How would abolishing the House of Lords affect UK democracy?",
  "Should the UK adopt a written constitution?",
  "What would be the impact of legalising cannabis in the UK?",
  "How effective is the UK's points-based immigration system?",
  "Should the UK introduce proportional representation?",
  "What are the trade-offs of renationalising UK railways?",
  "Should Scotland hold another independence referendum?",
  "How should the UK reform the NHS funding model?",
  "What would a four-day work week mean for the UK economy?",
  "Should the UK lower the voting age to 16?",
  "How can the UK balance net zero targets with economic growth?",
  "Should the UK introduce rent controls?",
  "What are the implications of reforming UK planning laws?",
  "Should university tuition fees be abolished in the UK?",

  // US Politics & Society
  "What are the pros and cons of Universal Basic Income?",
  "Should the US adopt Medicare for All?",
  "How would abolishing the Electoral College affect US democracy?",
  "Should the Supreme Court have term limits?",
  "What would be the impact of federal marijuana legalization?",
  "Should the US implement ranked choice voting nationwide?",
  "How can the US balance border security with immigration reform?",
  "Should corporations face stricter antitrust enforcement?",
  "What are the trade-offs of student loan forgiveness?",
  "Should the US adopt a carbon tax?",
  "How would federal paid family leave affect American workers?",
  "Should the US ban Congressional stock trading?",
  "What would raising the federal minimum wage to $15 achieve?",
  "Should the US implement universal pre-K education?",
  "How can the US address housing affordability?",

  // Shared Global Issues
  "How should democracies regulate AI development?",
  "What are the trade-offs of central bank digital currencies?",
  "Should social media platforms be regulated like utilities?",
  "How can nations balance free speech with online safety?",
  "What's the most effective approach to reduce wealth inequality?",
  "Should governments tax automation and robots?",
  "How should countries respond to declining birth rates?",
  "What role should nuclear power play in decarbonization?",
  "Should there be a wealth tax on billionaires?",
  "How can democracies combat political polarization?",
];

// Shuffle and select questions - returns different questions each render
function getRandomQuestions(count: number = 6): string[] {
  const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [generationStage, setGenerationStage] = useState<GenerationStage>("research");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(TOTAL_ESTIMATED_TIME / 1000);

  // Dynamic example questions that change on mount and rotate
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
    // Initialize with random questions
    setExampleQuestions(getRandomQuestions(6));

    // Rotate questions every 30 seconds
    const rotateInterval = setInterval(() => {
      setExampleQuestions(getRandomQuestions(6));
    }, 30000);

    return () => clearInterval(rotateInterval);
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
            const eventType = line.slice(7);
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

  // Compute formatted question preview
  const formattedQuestion = useMemo(() => formatQuestionTitle(question), [question]);
  const willBeFormatted = useMemo(() => wouldFormatChange(question), [question]);

  const handleExampleClick = (exampleQuestion: string) => {
    setQuestion(exampleQuestion);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-700 font-ui mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold font-heading text-ink-800 mb-4">
            Ask Anything
          </h1>
          <p className="text-lg font-body text-ink-600 max-w-xl mx-auto">
            Transform any political question into an evidence-based policy brief with transparent sources 
            and four reading levels.
          </p>
        </div>

        {/* Ask Form */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute top-4 left-4 pointer-events-none">
                <Search className="h-5 w-5 text-ink-400" />
              </div>
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_QUESTION_LENGTH + 50) {
                    setQuestion(e.target.value);
                  }
                }}
                placeholder="Ask a policy question..."
                rows={3}
                className={cn(
                  "w-full pl-12 pr-4 py-4 rounded-xl resize-none",
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
                {charStatus.message || (question.length === 0 ? "Be specific for better results" : "")}
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

            {/* Formatting Preview */}
            {willBeFormatted && question.trim().length >= MIN_QUESTION_LENGTH && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-sage-50 border border-sage-200">
                <Wand2 className="w-4 h-4 text-sage-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="text-sage-700 font-medium">Auto-formatted: </span>
                  <span className="text-ink-700">{formattedQuestion}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !question.trim() || charStatus.status === "too-short" || charStatus.status === "too-long"}
              className={cn(
                "w-full",
                "px-6 py-4 rounded-xl",
                "min-h-[48px]",
                "bg-sage-500 text-ivory-100 font-ui font-medium text-base",
                "hover:bg-sage-600 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                "disabled:bg-ivory-400 disabled:text-ink-400 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Brief...
                </>
              ) : (
                "Get Brief"
              )}
            </button>
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
          redirectPath="/ask"
        />

        {/* Error Message */}
        {error && !isLoading && (
          <div className={cn(
            "mb-8 p-4 rounded-lg",
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

        {/* Example Questions */}
        {exampleQuestions.length > 0 && (
          <div>
            <h2 className="text-sm font-ui font-medium text-ink-500 mb-4 text-center">
              Or try one of these examples:
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {exampleQuestions.map((exampleQuestion) => (
                <button
                  key={exampleQuestion}
                  type="button"
                  onClick={() => handleExampleClick(exampleQuestion)}
                  disabled={isLoading}
                  className={cn(
                    "px-3 py-2 rounded-lg",
                    "bg-ivory-50 border border-ivory-600",
                    "text-sm font-ui text-ink-600",
                    "hover:bg-ivory-300 hover:border-ivory-700 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {exampleQuestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
