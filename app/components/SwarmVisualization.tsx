"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Brain,
  FileText,
  MessageSquare,
  Scale,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import type { AgentStatus } from "@/lib/types/generation-events";

interface SwarmAgent {
  id: string;
  name: string;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "research" | "structure-narrative" | "summary" | "clarity";
  parallelWith?: string[];
}

const AGENTS: SwarmAgent[] = [
  {
    id: "research",
    name: "Research Agent",
    displayName: "Research",
    icon: Search,
    group: "research",
  },
  {
    id: "classification",
    name: "Classification",
    displayName: "Classify",
    icon: Brain,
    group: "research",
  },
  {
    id: "structure",
    name: "Structure Agent",
    displayName: "Structure",
    icon: FileText,
    group: "structure-narrative",
    parallelWith: ["narrative"],
  },
  {
    id: "narrative",
    name: "Narrative Agent",
    displayName: "Narrative",
    icon: MessageSquare,
    group: "structure-narrative",
    parallelWith: ["structure"],
  },
  {
    id: "reconciliation",
    name: "Reconciliation",
    displayName: "Reconcile",
    icon: Scale,
    group: "structure-narrative",
  },
  {
    id: "clarity",
    name: "Clarity Scoring",
    displayName: "Clarity",
    icon: Sparkles,
    group: "clarity",
  },
];

const STAGE_LABELS: Record<string, string> = {
  initializing: "Initializing...",
  research: "Researching your question...",
  classification: "Classifying question type...",
  "structure-narrative": "Generating structure and narrative...",
  reconciliation: "Reconciling outputs...",
  summary: "Writing summaries for all reading levels...",
  clarity: "Calculating clarity score...",
  complete: "Brief ready!",
};

interface SwarmVisualizationProps {
  agentStatuses: AgentStatus[];
  currentStage: string;
  isComplete?: boolean;
}

export function SwarmVisualization({
  agentStatuses,
  currentStage,
  isComplete = false,
}: SwarmVisualizationProps) {
  const [animationTick, setAnimationTick] = useState(0);

  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setAnimationTick((t) => t + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isComplete]);

  const getAgentState = (
    agentId: string
  ): "pending" | "running" | "completed" | "failed" => {
    const status = agentStatuses.find(
      (s: AgentStatus) =>
        s.name.toLowerCase().includes(agentId) ||
        agentId.includes(s.name.toLowerCase())
    );
    if (status) {
      return status.status;
    }
    return "pending";
  };

  const stageLabel =
    STAGE_LABELS[currentStage] || `${currentStage.charAt(0).toUpperCase()}${currentStage.slice(1)}...`;

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Generating your brief
        </h2>
        <p className="text-muted-foreground animate-pulse">{stageLabel}</p>
      </div>

      <div className="relative w-80 h-80">
        {AGENTS.map((agent, index: number) => {
          const state = getAgentState(agent.id);
          const Icon = agent.icon;
          const angle = (index / AGENTS.length) * 2 * Math.PI - Math.PI / 2;
          const radius = 100;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          const isRunning = state === "running";
          const isCompleted = state === "completed";
          const isPending = state === "pending";
          const isFailed = state === "failed";

          return (
            <div
              key={agent.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `calc(50% + ${x}px - 32px)`,
                top: `calc(50% + ${y}px - 32px)`,
              }}
            >
              <div
                className={`
                  relative w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${
                    isRunning
                      ? "bg-primary/20 border-2 border-primary shadow-lg shadow-primary/20"
                      : isCompleted
                      ? "bg-green-500/20 border-2 border-green-500"
                      : isFailed
                      ? "bg-red-500/20 border-2 border-red-500"
                      : "bg-muted border-2 border-muted-foreground/20"
                  }
                  ${isRunning ? "animate-pulse" : ""}
                `}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : isRunning ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <Icon
                    className={`w-6 h-6 ${
                      isPending
                        ? "text-muted-foreground/50"
                        : isFailed
                        ? "text-red-500"
                        : "text-foreground"
                    }`}
                  />
                )}

                {agent.parallelWith && isRunning && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold">
                    ∥
                  </span>
                )}
              </div>

              <span
                className={`mt-2 text-xs font-medium ${
                  isRunning
                    ? "text-primary"
                    : isCompleted
                    ? "text-green-500"
                    : "text-muted-foreground"
                }`}
              >
                {agent.displayName}
              </span>
            </div>
          );
        })}

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isComplete
                ? "bg-green-500/20 border-2 border-green-500"
                : "bg-gradient-to-br from-primary/20 to-purple-500/20 border-2 border-primary/50"
            }`}
          >
            {isComplete ? (
              <Check className="w-8 h-8 text-green-500" />
            ) : (
              <div className="w-12 h-12 rounded-full clarity-gradient animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted border border-muted-foreground/20" />
          <span>Waiting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary animate-pulse" />
          <span>Running</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500" />
          <span>Complete</span>
        </div>
      </div>
    </div>
  );
}

export default SwarmVisualization;
