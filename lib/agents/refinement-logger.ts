/**
 * Execution Logger
 *
 * Logs agent execution metrics to agent_execution_logs table for observability.
 * Tracks refinement attempts, fixer deployments, edits, scores, timing, and costs.
 */

import { createServiceRoleClient } from "@/lib/supabase/client";
import { FixerType, RefinementAttempt, SuggestedEdit } from "@/lib/types/refinement";

export type AgentType = "fixer" | "orchestrator" | "reconciliation" | "refinement_loop";
export type LogStatus = "running" | "success" | "failed" | "skipped";

export interface RefinementLogMetadata {
  attemptNumber: number;
  fixersDeployed: FixerType[];
  editsCount: {
    suggested: number;
    applied: number;
    skipped: number;
  };
  scores: {
    before: number;
    after: number;
    change: number;
  };
  dimensionScores?: Record<string, { before: number; after: number }>;
  processingTimeMs: number;
}

export interface RefinementSummaryMetadata {
  totalAttempts: number;
  initialScore: number;
  finalScore: number;
  success: boolean;
  totalProcessingTimeMs: number;
  totalEditsSuggested: number;
  totalEditsApplied: number;
  totalEditsSkipped: number;
  estimatedCostUsd: number;
  warningReason?: string;
  scoreProgression: Array<{ attempt: number; score: number }>;
}

export interface FixerLogMetadata {
  fixerType: FixerType;
  dimensionScore: number;
  editsGenerated: number;
  confidence: number;
  processingTimeMs: number;
}

export interface OrchestratorLogMetadata {
  fixersDeployed: FixerType[];
  fixersSkipped: FixerType[];
  totalEditsCollected: number;
  processingTimeMs: number;
  dimensionScores: Record<string, number>;
}

export interface ReconciliationLogMetadata {
  editsReceived: number;
  editsApplied: number;
  editsSkipped: number;
  conflictsResolved: number;
  processingTimeMs: number;
}

const HAIKU_COST_PER_1K_INPUT = 0.00025;
const HAIKU_COST_PER_1K_OUTPUT = 0.00125;
const SONNET_COST_PER_1K_INPUT = 0.003;
const SONNET_COST_PER_1K_OUTPUT = 0.015;

const AVG_FIXER_INPUT_TOKENS = 2000;
const AVG_FIXER_OUTPUT_TOKENS = 500;
const AVG_RECONCILIATION_INPUT_TOKENS = 4000;
const AVG_RECONCILIATION_OUTPUT_TOKENS = 2000;
const AVG_SCORING_INPUT_TOKENS = 3000;
const AVG_SCORING_OUTPUT_TOKENS = 1000;

export function estimateRefinementCost(
  fixerCount: number,
  attempts: number
): number {
  const fixerCostPerRun =
    (AVG_FIXER_INPUT_TOKENS / 1000) * HAIKU_COST_PER_1K_INPUT +
    (AVG_FIXER_OUTPUT_TOKENS / 1000) * HAIKU_COST_PER_1K_OUTPUT;
  
  const reconciliationCostPerRun =
    (AVG_RECONCILIATION_INPUT_TOKENS / 1000) * SONNET_COST_PER_1K_INPUT +
    (AVG_RECONCILIATION_OUTPUT_TOKENS / 1000) * SONNET_COST_PER_1K_OUTPUT;
  
  const scoringCostPerRun =
    (AVG_SCORING_INPUT_TOKENS / 1000) * SONNET_COST_PER_1K_INPUT +
    (AVG_SCORING_OUTPUT_TOKENS / 1000) * SONNET_COST_PER_1K_OUTPUT;
  
  const costPerAttempt =
    fixerCostPerRun * fixerCount + reconciliationCostPerRun + scoringCostPerRun;
  
  return Math.round(costPerAttempt * attempts * 10000) / 10000;
}

export async function logAgentExecution(params: {
  briefId?: string;
  agentName: string;
  agentType: AgentType;
  status: LogStatus;
  durationMs?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("agent_execution_logs")
      .insert({
        brief_id: params.briefId,
        agent_name: params.agentName,
        agent_type: params.agentType,
        started_at: now,
        completed_at: params.durationMs ? now : null,
        duration_ms: params.durationMs,
        status: params.status,
        error_message: params.errorMessage,
        metadata: params.metadata || {},
      } as never)
      .select("id")
      .single();

    if (error) {
      console.error("[ExecutionLogger] Failed to log execution:", error);
      return null;
    }

    return (data as { id: string })?.id || null;
  } catch (err) {
    console.error("[ExecutionLogger] Error:", err);
    return null;
  }
}

export async function logRefinementAttempt(
  briefId: string | undefined,
  attempt: RefinementAttempt
): Promise<string | null> {
  const metadata: RefinementLogMetadata = {
    attemptNumber: attempt.attemptNumber,
    fixersDeployed: attempt.fixersDeployed,
    editsCount: {
      suggested: attempt.editsMade.length + (attempt.editsSkipped?.length || 0),
      applied: attempt.editsMade.length,
      skipped: attempt.editsSkipped?.length || 0,
    },
    scores: {
      before: attempt.scoreBeforeAfter.before,
      after: attempt.scoreBeforeAfter.after,
      change: attempt.scoreBeforeAfter.after - attempt.scoreBeforeAfter.before,
    },
    dimensionScores: attempt.scoreBeforeAfter.dimensionScores,
    processingTimeMs: attempt.processingTime || 0,
  };

  const status: LogStatus =
    attempt.scoreBeforeAfter.after >= 8.0 ? "success" : "success";

  return logAgentExecution({
    briefId,
    agentName: `refinement_attempt_${attempt.attemptNumber}`,
    agentType: "refinement_loop",
    status,
    durationMs: attempt.processingTime,
    metadata: metadata as unknown as Record<string, unknown>,
  });
}

export async function logRefinementSummary(
  briefId: string | undefined,
  params: {
    attempts: RefinementAttempt[];
    initialScore: number;
    finalScore: number;
    success: boolean;
    totalProcessingTimeMs: number;
    warningReason?: string;
  }
): Promise<string | null> {
  const totalEditsSuggested = params.attempts.reduce(
    (sum, a) => sum + a.editsMade.length + (a.editsSkipped?.length || 0),
    0
  );
  const totalEditsApplied = params.attempts.reduce(
    (sum, a) => sum + a.editsMade.length,
    0
  );
  const totalEditsSkipped = params.attempts.reduce(
    (sum, a) => sum + (a.editsSkipped?.length || 0),
    0
  );

  const avgFixersPerAttempt =
    params.attempts.length > 0
      ? params.attempts.reduce((sum, a) => sum + a.fixersDeployed.length, 0) /
        params.attempts.length
      : 0;

  const estimatedCostUsd = estimateRefinementCost(
    Math.round(avgFixersPerAttempt),
    params.attempts.length
  );

  const scoreProgression = params.attempts.map((a) => ({
    attempt: a.attemptNumber,
    score: a.scoreBeforeAfter.after,
  }));

  const metadata: RefinementSummaryMetadata = {
    totalAttempts: params.attempts.length,
    initialScore: params.initialScore,
    finalScore: params.finalScore,
    success: params.success,
    totalProcessingTimeMs: params.totalProcessingTimeMs,
    totalEditsSuggested,
    totalEditsApplied,
    totalEditsSkipped,
    estimatedCostUsd,
    warningReason: params.warningReason,
    scoreProgression,
  };

  const status: LogStatus = params.success ? "success" : "failed";

  console.log(
    `[ExecutionLogger] Refinement summary: ${params.success ? "SUCCESS" : "FAILED"} | ` +
      `Score: ${params.initialScore.toFixed(1)} → ${params.finalScore.toFixed(1)} | ` +
      `Attempts: ${params.attempts.length} | ` +
      `Edits: ${totalEditsApplied}/${totalEditsSuggested} applied | ` +
      `Time: ${(params.totalProcessingTimeMs / 1000).toFixed(1)}s | ` +
      `Est. cost: $${estimatedCostUsd.toFixed(4)}`
  );

  return logAgentExecution({
    briefId,
    agentName: "refinement_loop_summary",
    agentType: "refinement_loop",
    status,
    durationMs: params.totalProcessingTimeMs,
    errorMessage: params.success ? undefined : params.warningReason,
    metadata: metadata as unknown as Record<string, unknown>,
  });
}

export async function logFixerExecution(
  briefId: string | undefined,
  params: {
    fixerType: FixerType;
    dimensionScore: number;
    editsGenerated: number;
    confidence: number;
    processingTimeMs: number;
    status: LogStatus;
    errorMessage?: string;
  }
): Promise<string | null> {
  const metadata: FixerLogMetadata = {
    fixerType: params.fixerType,
    dimensionScore: params.dimensionScore,
    editsGenerated: params.editsGenerated,
    confidence: params.confidence,
    processingTimeMs: params.processingTimeMs,
  };

  return logAgentExecution({
    briefId,
    agentName: `fixer_${params.fixerType}`,
    agentType: "fixer",
    status: params.status,
    durationMs: params.processingTimeMs,
    errorMessage: params.errorMessage,
    metadata: metadata as unknown as Record<string, unknown>,
  });
}

export async function logOrchestratorExecution(
  briefId: string | undefined,
  params: {
    fixersDeployed: FixerType[];
    fixersSkipped: FixerType[];
    totalEditsCollected: number;
    processingTimeMs: number;
    dimensionScores: Record<string, number>;
    status: LogStatus;
    errorMessage?: string;
  }
): Promise<string | null> {
  const metadata: OrchestratorLogMetadata = {
    fixersDeployed: params.fixersDeployed,
    fixersSkipped: params.fixersSkipped,
    totalEditsCollected: params.totalEditsCollected,
    processingTimeMs: params.processingTimeMs,
    dimensionScores: params.dimensionScores,
  };

  console.log(
    `[ExecutionLogger] Orchestrator: Deployed ${params.fixersDeployed.length} fixers, ` +
      `skipped ${params.fixersSkipped.length}, collected ${params.totalEditsCollected} edits`
  );

  return logAgentExecution({
    briefId,
    agentName: "fixer_orchestrator",
    agentType: "orchestrator",
    status: params.status,
    durationMs: params.processingTimeMs,
    errorMessage: params.errorMessage,
    metadata: metadata as unknown as Record<string, unknown>,
  });
}

export async function logReconciliationExecution(
  briefId: string | undefined,
  params: {
    editsReceived: number;
    editsApplied: number;
    editsSkipped: number;
    conflictsResolved: number;
    processingTimeMs: number;
    status: LogStatus;
    errorMessage?: string;
  }
): Promise<string | null> {
  const metadata: ReconciliationLogMetadata = {
    editsReceived: params.editsReceived,
    editsApplied: params.editsApplied,
    editsSkipped: params.editsSkipped,
    conflictsResolved: params.conflictsResolved,
    processingTimeMs: params.processingTimeMs,
  };

  console.log(
    `[ExecutionLogger] Reconciliation: Applied ${params.editsApplied}/${params.editsReceived} edits, ` +
      `resolved ${params.conflictsResolved} conflicts`
  );

  return logAgentExecution({
    briefId,
    agentName: "edit_reconciliation",
    agentType: "reconciliation",
    status: params.status,
    durationMs: params.processingTimeMs,
    errorMessage: params.errorMessage,
    metadata: metadata as unknown as Record<string, unknown>,
  });
}
