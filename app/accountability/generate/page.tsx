"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Search,
  ListTree,
  PenLine,
  CheckCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useInvestigationGeneration,
  type AgentName,
  type AgentStatusType,
} from "@/lib/hooks/useInvestigationGeneration";

const STAGES: { name: AgentName; label: string; icon: React.ElementType }[] = [
  { name: "entity_classification", label: "Entity Classification", icon: User },
  { name: "uk_profile_research", label: "UK Profile Research", icon: Search },
  { name: "corruption_analysis", label: "Corruption Analysis", icon: ListTree },
  {
    name: "action_list_generation",
    label: "Action List Generation",
    icon: PenLine,
  },
  { name: "quality_check", label: "Quality Check", icon: CheckCircle },
];

function GeneratePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entity = searchParams.get("entity") || "";

  const {
    status,
    progress,
    agentStatuses,
    investigationId,
    qualityScore,
    creditRefunded,
    error,
    startGeneration,
  } = useInvestigationGeneration(entity, true);

  useEffect(() => {
    if (entity && status === "idle") {
      startGeneration();
    }
  }, [entity, status, startGeneration]);

  useEffect(() => {
    if (status === "complete" && investigationId) {
      router.push(`/accountability/${investigationId}`);
    }
  }, [status, investigationId, router]);

  const getAgentStatus = (agentName: AgentName): AgentStatusType => {
    const agent = agentStatuses.find((a) => a.name === agentName);
    return agent?.status || "pending";
  };

  const renderStageIcon = (
    stage: (typeof STAGES)[0],
    agentStatus: AgentStatusType
  ) => {
    const Icon = stage.icon;

    if (agentStatus === "completed") {
      return <CheckCircle2 className="w-6 h-6 text-sage-500" />;
    }
    if (agentStatus === "running") {
      return <Loader2 className="w-6 h-6 text-sage-500 animate-spin" />;
    }
    return <Icon className="w-6 h-6 text-ink-400" />;
  };

  if (!entity) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-warning-dark mx-auto mb-4" />
          <h1 className="text-xl font-heading text-ink-800 mb-2">
            No entity specified
          </h1>
          <p className="text-ink-600 mb-4">
            Please start from the Accountability Tracker page.
          </p>
          <button
            onClick={() => router.push("/accountability")}
            className="px-6 py-2 bg-sage-500 text-ivory-100 rounded-lg hover:bg-sage-600"
          >
            Go to Accountability Tracker
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-heading font-semibold text-ink-800 mb-2">
            Investigating: {entity}
          </h1>
          <p className="text-ink-600 font-body">
            Please wait while we analyze UK public records...
          </p>
        </div>

        {(status === "error" || status === "quality_failed") && (
          <div
            className={cn(
              "mb-8 p-6 rounded-xl border",
              status === "error"
                ? "bg-red-50 border-red-200"
                : "bg-warning-light border-warning"
            )}
          >
            <div className="flex items-start gap-3">
              <XCircle
                className={cn(
                  "w-6 h-6 flex-shrink-0",
                  status === "error" ? "text-red-600" : "text-warning-dark"
                )}
              />
              <div>
                <h2
                  className={cn(
                    "font-heading font-semibold mb-1",
                    status === "error" ? "text-red-800" : "text-warning-dark"
                  )}
                >
                  {status === "error"
                    ? "Generation Failed"
                    : "Insufficient Data Found"}
                </h2>
                <p
                  className={cn(
                    "text-sm mb-3",
                    status === "error" ? "text-red-700" : "text-warning-dark"
                  )}
                >
                  {error ||
                    `We could not find enough public data for "${entity}" to generate a meaningful investigation.`}
                </p>
                {creditRefunded && (
                  <p className="text-sm font-medium text-sage-700">
                    ✓ Your credit has been refunded.
                  </p>
                )}
                <button
                  onClick={() => router.push("/accountability")}
                  className="mt-4 px-4 py-2 bg-ink-800 text-ivory-100 rounded-lg text-sm hover:bg-ink-700"
                >
                  Try Another Entity
                </button>
              </div>
            </div>
          </div>
        )}

        {status !== "error" && status !== "quality_failed" && (
          <>
            <div className="mb-8">
              <div className="h-2 bg-ivory-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sage-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-ink-500 mt-2">
                {Math.round(progress)}% complete
              </p>
            </div>

            <div className="space-y-4">
              {STAGES.map((stage) => {
                const agentStatus = getAgentStatus(stage.name);
                return (
                  <div
                    key={stage.name}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                      agentStatus === "completed"
                        ? "bg-sage-50 border-sage-200"
                        : agentStatus === "running"
                          ? "bg-ivory-50 border-sage-300 shadow-sm"
                          : "bg-ivory-50 border-ivory-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        agentStatus === "completed"
                          ? "bg-sage-100"
                          : agentStatus === "running"
                            ? "bg-sage-100"
                            : "bg-ivory-200"
                      )}
                    >
                      {renderStageIcon(stage, agentStatus)}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "font-ui font-medium",
                          agentStatus === "completed"
                            ? "text-sage-700"
                            : agentStatus === "running"
                              ? "text-ink-800"
                              : "text-ink-500"
                        )}
                      >
                        {stage.label}
                      </h3>
                      <p className="text-sm text-ink-500">
                        {agentStatus === "completed"
                          ? "Complete"
                          : agentStatus === "running"
                            ? "In progress..."
                            : "Waiting"}
                      </p>
                    </div>
                    {agentStatus === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-sage-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-12 p-4 rounded-lg bg-warning-light border border-warning">
          <p className="text-sm text-warning-dark text-center">
            <strong>Reminder:</strong> This tool identifies theoretical
            corruption possibilities. All individuals are presumed innocent
            until proven guilty.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-sage-500 animate-spin" />
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
