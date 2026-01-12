"use client";

import {
  Search,
  ListTree,
  BookOpen,
  PenLine,
  Target,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GenerationStage } from "@/lib/types/brief";

const STAGES: {
  name: GenerationStage;
  icon: typeof Search;
  label: string;
}[] = [
  { name: "research", icon: Search, label: "Finding credible sources" },
  { name: "structure", icon: ListTree, label: "Identifying key factors" },
  { name: "summary", icon: BookOpen, label: "Writing summaries for each reading level" },
  { name: "narrative", icon: PenLine, label: "Building the full analysis" },
  { name: "scoring", icon: Target, label: "Scoring for clarity and transparency" },
];

interface BriefGenerationProgressProps {
  currentStage: GenerationStage;
  progress: number;
  estimatedSecondsRemaining: number;
  className?: string;
}

export function BriefGenerationProgress({
  currentStage,
  progress,
  estimatedSecondsRemaining,
  className,
}: BriefGenerationProgressProps) {
  const currentStageIndex = STAGES.findIndex((s) => s.name === currentStage);

  return (
    <div
      className={cn(
        "max-w-md mx-auto p-6 bg-ivory-100 rounded-lg shadow-lg border border-ivory-600",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Brief generation in progress. Currently ${STAGES[currentStageIndex]?.label || "processing"}. ${estimatedSecondsRemaining} seconds remaining.`}
    >
      <h3 className="font-heading text-lg font-semibold text-ink-800 text-center mb-2">
        Generating Your Brief
      </h3>
      <p className="text-sm text-ink-500 font-ui text-center mb-6">
        ~{estimatedSecondsRemaining}s remaining
      </p>

      {/* Progress bar */}
      <div
        className="h-2 bg-ivory-300 rounded-full mb-6 overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progress}% complete`}
      >
        <div
          className="h-full bg-sage-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {STAGES.map((stage, index) => {
          const isActive = stage.name === currentStage;
          const isComplete = currentStageIndex > index;
          const Icon = stage.icon;

          return (
            <div
              key={stage.name}
              className={cn(
                "flex items-center gap-3 p-3 rounded-md transition-all duration-300",
                isActive && "bg-sage-50 border border-sage-200"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive && "bg-sage-500 text-ivory-100",
                  isComplete && "bg-success text-ivory-100",
                  !isActive && !isComplete && "bg-ivory-300 text-ink-500"
                )}
              >
                {isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <p
                className={cn(
                  "text-sm font-medium font-ui transition-colors duration-300",
                  isActive && "text-sage-700",
                  isComplete && "text-ink-600",
                  !isActive && !isComplete && "text-ink-500"
                )}
              >
                {stage.label}
              </p>
              {isComplete && (
                <span className="ml-auto text-xs text-success font-ui">
                  Complete
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
