/**
 * Quality Gate Metrics Service
 * 
 * Logs quality gate decisions to database for analysis.
 * Tracks: initial score, final score, attempts, tier, decision, refund.
 * Calculates: pass rate, average attempts, refund rate.
 */

import { createServiceRoleClient, type Database } from "../supabase/client";
import { QualityGateResult, QualityTier } from "../types/quality-gate";
import { v4 as uuidv4 } from "uuid";

type AgentExecutionLogInsert = Database["public"]["Tables"]["agent_execution_logs"]["Insert"];
type QualityGateDecisionInsert = Database["public"]["Tables"]["quality_gate_decisions"]["Insert"];
type QualityGateDecisionRow = Database["public"]["Tables"]["quality_gate_decisions"]["Row"];

export interface ExecutionContext {
  executionId: string;
  startTime: number;
  briefId?: string | null;
}

/**
 * Create a new execution context for a pipeline run
 */
export function createExecutionContext(): ExecutionContext {
  return {
    executionId: uuidv4(),
    startTime: Date.now(),
  };
}

/**
 * Log a pipeline step to agent_execution_logs
 */
export async function logPipelineStep(
  context: ExecutionContext,
  step: {
    name: string;
    type: AgentExecutionLogInsert["step_type"];
    status: AgentExecutionLogInsert["status"];
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = createServiceRoleClient();
  const durationMs = Date.now() - context.startTime;

  const logEntry: AgentExecutionLogInsert = {
    brief_id: context.briefId || null,
    execution_id: context.executionId,
    step_name: step.name,
    step_type: step.type,
    status: step.status,
    metadata: step.metadata || {},
    duration_ms: durationMs,
  };

  const { error } = await supabase
    .from("agent_execution_logs")
    .insert(logEntry as never);

  if (error) {
    console.warn(`[QualityGateMetrics] Failed to log step ${step.name}:`, error.message);
  } else {
    console.log(`[QualityGateMetrics] Logged step: ${step.name} (${durationMs}ms)`);
  }
}

/**
 * Log a quality gate decision
 */
export async function logQualityGateDecision(
  context: ExecutionContext,
  question: string,
  result: QualityGateResult,
  options: {
    initialScore?: number;
    evaluatorScores?: Array<{ evaluator: string; score: number; reasoning: string }>;
    refinementHistory?: Array<{ attempt: number; score: number; feedback: string }>;
    decisionReasoning?: string;
    refundTriggered?: boolean;
    retryScheduled?: boolean;
  } = {}
): Promise<void> {
  const supabase = createServiceRoleClient();

  const tierString: "high" | "acceptable" | "failed" = 
    result.tier === QualityTier.HIGH ? "high" :
    result.tier === QualityTier.ACCEPTABLE ? "acceptable" : "failed";

  const decision: QualityGateDecisionInsert = {
    brief_id: context.briefId || null,
    execution_id: context.executionId,
    question,
    initial_score: options.initialScore ?? null,
    final_score: result.finalScore,
    tier: tierString,
    attempts: result.attempts,
    publishable: result.publishable,
    refund_triggered: options.refundTriggered ?? false,
    retry_scheduled: options.retryScheduled ?? false,
    evaluator_scores: options.evaluatorScores ? { scores: options.evaluatorScores } : null,
    refinement_history: options.refinementHistory ? { history: options.refinementHistory } : null,
    decision_reasoning: options.decisionReasoning ?? null,
  };

  const { error } = await supabase
    .from("quality_gate_decisions")
    .insert(decision as never);

  if (error) {
    console.warn("[QualityGateMetrics] Failed to log decision:", error.message);
  } else {
    console.log(`[QualityGateMetrics] Logged decision: ${tierString} (${result.finalScore.toFixed(1)}/10)`);
  }
}

/**
 * Calculate and log quality gate metrics
 */
export async function calculateQualityGateMetrics(
  periodDays: number = 30
): Promise<QualityGateMetricsSummary> {
  const supabase = createServiceRoleClient();
  
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);

  const { data, error } = await supabase
    .from("quality_gate_decisions")
    .select("*")
    .gte("created_at", periodStart.toISOString());

  if (error || !data) {
    console.error("[QualityGateMetrics] Failed to fetch decisions:", error?.message);
    return getEmptyMetrics();
  }

  const decisions = data as QualityGateDecisionRow[];
  const total = decisions.length;
  if (total === 0) {
    return getEmptyMetrics();
  }

  const published = decisions.filter((d) => d.publishable).length;
  const highQuality = decisions.filter((d) => d.tier === "high").length;
  const acceptable = decisions.filter((d) => d.tier === "acceptable").length;
  const failed = decisions.filter((d) => d.tier === "failed").length;
  const refunds = decisions.filter((d) => d.refund_triggered).length;
  const retries = decisions.filter((d) => d.retry_scheduled).length;

  const totalAttempts = decisions.reduce((sum, d) => sum + (d.attempts || 1), 0);
  const averageScore = decisions.reduce((sum, d) => sum + (d.final_score || 0), 0) / total;

  const metrics: QualityGateMetricsSummary = {
    periodDays,
    total,
    passRate: (published / total) * 100,
    averageAttempts: totalAttempts / total,
    refundRate: (refunds / total) * 100,
    averageScore,
    tierBreakdown: {
      high: highQuality,
      acceptable: acceptable,
      failed: failed,
    },
    tierPercentages: {
      high: (highQuality / total) * 100,
      acceptable: (acceptable / total) * 100,
      failed: (failed / total) * 100,
    },
    retryRate: (retries / total) * 100,
  };

  console.log("[QualityGateMetrics] Metrics calculated:");
  console.log(`  - Pass rate: ${metrics.passRate.toFixed(1)}%`);
  console.log(`  - Average attempts: ${metrics.averageAttempts.toFixed(2)}`);
  console.log(`  - Refund rate: ${metrics.refundRate.toFixed(1)}%`);
  console.log(`  - Average score: ${metrics.averageScore.toFixed(1)}/10`);

  return metrics;
}

export interface QualityGateMetricsSummary {
  periodDays: number;
  total: number;
  passRate: number;
  averageAttempts: number;
  refundRate: number;
  averageScore: number;
  tierBreakdown: {
    high: number;
    acceptable: number;
    failed: number;
  };
  tierPercentages: {
    high: number;
    acceptable: number;
    failed: number;
  };
  retryRate: number;
}

function getEmptyMetrics(): QualityGateMetricsSummary {
  return {
    periodDays: 0,
    total: 0,
    passRate: 0,
    averageAttempts: 0,
    refundRate: 0,
    averageScore: 0,
    tierBreakdown: { high: 0, acceptable: 0, failed: 0 },
    tierPercentages: { high: 0, acceptable: 0, failed: 0 },
    retryRate: 0,
  };
}
