/**
 * Consensus Scorer
 *
 * Orchestrates parallel execution of the 3-evaluator consensus panel.
 * Runs Skeptic, Advocate, and Generalist in parallel, collects verdicts.
 * Target: All 3 evaluators complete in <8 seconds total.
 */

import {
  getEvaluatorPersona,
  getPrimaryEvaluatorRoles,
  EvaluatorPersona,
} from "./clarity-evaluator-personas";
import {
  evaluateBrief,
  Brief,
  EvaluateBriefInput,
} from "./clarity-evaluator-agent";
import {
  EvaluatorVerdict,
  DisagreementResult,
  DimensionName,
  DimensionScore,
  ClarityScore,
  CLARITY_DIMENSIONS,
  getDimensionWeight,
} from "../types/clarity-scoring";
import { ARBITER_WEIGHT_MULTIPLIER } from "./tiebreaker-agent";

export interface ConsensusInput {
  brief: Brief | EvaluateBriefInput;
  verdicts: EvaluatorVerdict[];
  totalDurationMs: number;
  evaluatorDurations: {
    role: string;
    durationMs: number;
  }[];
}

export interface EvaluatorExecutionLog {
  role: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  success: boolean;
  error?: string;
  retryCount: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 500,
  maxDelayMs: 3000,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 200;
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

async function evaluateWithRetry(
  brief: Brief | EvaluateBriefInput,
  persona: EvaluatorPersona,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ verdict: EvaluatorVerdict; log: EvaluatorExecutionLog }> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  let lastError: Error | undefined;
  let retryCount = 0;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const retryDelay = getRetryDelay(attempt - 1, config);
        console.log(
          `[Consensus Scorer] Retrying ${persona.name} (attempt ${attempt + 1}/${config.maxRetries + 1}) after ${retryDelay}ms`
        );
        await delay(retryDelay);
        retryCount++;
      }

      const verdict = await evaluateBrief(brief, persona);
      const durationMs = Date.now() - startTime;

      console.log(
        `[Consensus Scorer] ${persona.name} completed in ${durationMs}ms (retries: ${retryCount})`
      );

      return {
        verdict,
        log: {
          role: persona.role,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs,
          success: true,
          retryCount,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[Consensus Scorer] ${persona.name} failed (attempt ${attempt + 1}):`,
        lastError.message
      );
    }
  }

  const durationMs = Date.now() - startTime;
  throw {
    error: lastError,
    log: {
      role: persona.role,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      success: false,
      error: lastError?.message,
      retryCount,
    },
  };
}

/**
 * Run all 3 primary evaluators in parallel
 *
 * Executes Skeptic, Advocate, and Generalist concurrently using Promise.all.
 * Target performance: <8 seconds total (parallel execution).
 *
 * @param brief - The brief to evaluate (full Brief or minimal EvaluateBriefInput)
 * @returns ConsensusInput containing all 3 verdicts and timing information
 */
export async function runParallelEvaluators(
  brief: Brief | EvaluateBriefInput
): Promise<ConsensusInput> {
  const overallStartTime = Date.now();
  const roles = getPrimaryEvaluatorRoles();

  console.log(
    `[Consensus Scorer] Starting parallel evaluation with ${roles.length} evaluators`
  );

  const evaluationPromises = roles.map((role) => {
    const persona = getEvaluatorPersona(role);
    return evaluateWithRetry(brief, persona);
  });

  const results = await Promise.all(evaluationPromises);

  const verdicts = results.map((r) => r.verdict);
  const evaluatorDurations = results.map((r) => ({
    role: r.log.role,
    durationMs: r.log.durationMs,
  }));

  const totalDurationMs = Date.now() - overallStartTime;

  console.log(
    `[Consensus Scorer] All evaluators completed in ${totalDurationMs}ms`
  );
  console.log(
    `[Consensus Scorer] Individual durations:`,
    evaluatorDurations.map((d) => `${d.role}: ${d.durationMs}ms`).join(", ")
  );

  if (totalDurationMs > 8000) {
    console.warn(
      `[Consensus Scorer] Total duration ${totalDurationMs}ms exceeds 8s target`
    );
  }

  return {
    brief,
    verdicts,
    totalDurationMs,
    evaluatorDurations,
  };
}

/**
 * Get execution logs for the most recent parallel evaluation
 * Logs are emitted to console during execution for now.
 * Future: Store in agent_execution_logs table.
 */
export function logConsensusExecution(input: ConsensusInput): void {
  console.log(`[Consensus Scorer] === Execution Summary ===`);
  console.log(`[Consensus Scorer] Total duration: ${input.totalDurationMs}ms`);
  console.log(`[Consensus Scorer] Evaluators: ${input.verdicts.length}`);

  for (const verdict of input.verdicts) {
    console.log(
      `[Consensus Scorer] ${verdict.evaluatorRole}: score=${verdict.overallScore.toFixed(1)}, ` +
        `issues=${verdict.issues.length}, confidence=${verdict.confidence.toFixed(2)}`
    );
  }

  const avgScore =
    input.verdicts.reduce((sum, v) => sum + v.overallScore, 0) /
    input.verdicts.length;
  console.log(`[Consensus Scorer] Average score: ${avgScore.toFixed(1)}`);
}

const DISAGREEMENT_THRESHOLD = 2;

/**
 * Detect when evaluators strongly disagree on dimensions or overall scores.
 * 
 * Flags disagreement if:
 * - Any dimension has a spread (max - min) > 2
 * - Overall score spread across evaluators > 2
 * 
 * @param verdicts - Array of evaluator verdicts to analyze
 * @returns DisagreementResult with details about disagreeing dimensions
 */
export function detectDisagreement(
  verdicts: EvaluatorVerdict[]
): DisagreementResult {
  if (verdicts.length < 2) {
    return {
      hasDisagreement: false,
      disagreeingDimensions: [],
      maxSpread: 0,
      evaluatorPositions: verdicts.map((v) => ({
        evaluator: v.evaluatorRole,
        overallScore: v.overallScore,
        divergentDimensions: [],
      })),
    };
  }

  const dimensionNames = Object.keys(CLARITY_DIMENSIONS) as DimensionName[];
  const disagreeingDimensions: DimensionName[] = [];
  let maxDimensionSpread = 0;

  const dimensionSpreads: Map<DimensionName, { min: number; max: number; spread: number }> = new Map();

  for (const dimension of dimensionNames) {
    const scores = verdicts.map((v) => {
      const dimScore = v.dimensionScores.find((d) => d.dimension === dimension);
      return dimScore?.score ?? 0;
    });

    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const spread = maxScore - minScore;

    dimensionSpreads.set(dimension, { min: minScore, max: maxScore, spread });

    if (spread > DISAGREEMENT_THRESHOLD) {
      disagreeingDimensions.push(dimension);
    }

    if (spread > maxDimensionSpread) {
      maxDimensionSpread = spread;
    }
  }

  const overallScores = verdicts.map((v) => v.overallScore);
  const overallMin = Math.min(...overallScores);
  const overallMax = Math.max(...overallScores);
  const overallSpread = overallMax - overallMin;

  const hasOverallDisagreement = overallSpread > DISAGREEMENT_THRESHOLD;
  const maxSpread = Math.max(maxDimensionSpread, overallSpread);

  const evaluatorPositions = verdicts.map((verdict) => {
    const divergentDimensions: { dimension: DimensionName; score: number }[] = [];

    for (const dimension of disagreeingDimensions) {
      const dimScore = verdict.dimensionScores.find((d) => d.dimension === dimension);
      if (dimScore) {
        divergentDimensions.push({
          dimension,
          score: dimScore.score,
        });
      }
    }

    return {
      evaluator: verdict.evaluatorRole,
      overallScore: verdict.overallScore,
      divergentDimensions,
    };
  });

  const hasDisagreement = disagreeingDimensions.length > 0 || hasOverallDisagreement;

  if (hasDisagreement) {
    console.log(`[Consensus Scorer] Disagreement detected:`);
    console.log(`[Consensus Scorer]   Overall spread: ${overallSpread.toFixed(1)}`);
    console.log(`[Consensus Scorer]   Disagreeing dimensions: ${disagreeingDimensions.join(", ") || "none"}`);
    console.log(`[Consensus Scorer]   Max spread: ${maxSpread.toFixed(1)}`);
  }

  return {
    hasDisagreement,
    disagreeingDimensions,
    maxSpread,
    evaluatorPositions,
  };
}

export interface FinalScoreInput {
  verdicts: EvaluatorVerdict[];
  disagreement?: DisagreementResult;
  arbiterVerdict?: EvaluatorVerdict;
  discussionOccurred?: boolean;
}

function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function calculateDimensionMedianScores(
  verdicts: EvaluatorVerdict[]
): DimensionScore[] {
  const dimensionNames = Object.keys(CLARITY_DIMENSIONS) as DimensionName[];
  
  return dimensionNames.map((dimension) => {
    const scores = verdicts.map((v) => {
      const dimScore = v.dimensionScores.find((d) => d.dimension === dimension);
      return dimScore?.score ?? 0;
    });
    
    const medianScore = getMedian(scores);
    const allReasonings = verdicts
      .map((v) => {
        const dimScore = v.dimensionScores.find((d) => d.dimension === dimension);
        return dimScore ? `[${v.evaluatorRole}] ${dimScore.reasoning}` : "";
      })
      .filter(Boolean);
    
    const allIssues = verdicts.flatMap((v) => {
      const dimScore = v.dimensionScores.find((d) => d.dimension === dimension);
      return dimScore?.issues ?? [];
    });

    return {
      dimension,
      score: Math.round(medianScore * 10) / 10,
      reasoning: allReasonings.join("\n\n"),
      issues: [...new Set(allIssues)],
    };
  });
}

function calculateDimensionScoresWithArbiter(
  verdicts: EvaluatorVerdict[],
  arbiterVerdict: EvaluatorVerdict,
  disagreeingDimensions: DimensionName[]
): DimensionScore[] {
  const dimensionNames = Object.keys(CLARITY_DIMENSIONS) as DimensionName[];
  
  return dimensionNames.map((dimension) => {
    const isDisputed = disagreeingDimensions.includes(dimension);
    
    const primaryScores = verdicts.map((v) => {
      const dimScore = v.dimensionScores.find((d) => d.dimension === dimension);
      return dimScore?.score ?? 0;
    });
    
    const arbiterScore = arbiterVerdict.dimensionScores.find(
      (d) => d.dimension === dimension
    )?.score ?? 0;

    let finalScore: number;
    if (isDisputed) {
      const totalWeight = verdicts.length + ARBITER_WEIGHT_MULTIPLIER;
      const sum = primaryScores.reduce((acc, s) => acc + s, 0) + (arbiterScore * ARBITER_WEIGHT_MULTIPLIER);
      finalScore = sum / totalWeight;
    } else {
      finalScore = getMedian(primaryScores);
    }

    const allReasonings = verdicts
      .map((v) => {
        const dimScore = v.dimensionScores.find((d) => d.dimension === dimension);
        return dimScore ? `[${v.evaluatorRole}] ${dimScore.reasoning}` : "";
      })
      .filter(Boolean);
    
    const arbiterReasoning = arbiterVerdict.dimensionScores.find(
      (d) => d.dimension === dimension
    )?.reasoning;
    if (arbiterReasoning) {
      allReasonings.push(`[Arbiter${isDisputed ? " - TIEBREAKER" : ""}] ${arbiterReasoning}`);
    }

    const allIssues = [...verdicts, arbiterVerdict].flatMap((v) => {
      const dimScore = v.dimensionScores.find((d) => d.dimension === dimension);
      return dimScore?.issues ?? [];
    });

    return {
      dimension,
      score: Math.round(finalScore * 10) / 10,
      reasoning: allReasonings.join("\n\n"),
      issues: [...new Set(allIssues)],
    };
  });
}

function consolidateCritiques(verdicts: EvaluatorVerdict[], arbiterVerdict?: EvaluatorVerdict): string {
  const critiques = verdicts.map((v) => `**${v.evaluatorRole}:** ${v.critique}`);
  
  if (arbiterVerdict) {
    critiques.push(`**Arbiter (Tiebreaker):** ${arbiterVerdict.critique}`);
  }
  
  return critiques.join("\n\n---\n\n");
}

function calculateWeightedOverall(dimensionScores: DimensionScore[]): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const dimScore of dimensionScores) {
    const weight = getDimensionWeight(dimScore.dimension);
    weightedSum += dimScore.score * weight;
    totalWeight += weight;
  }
  
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/**
 * Calculate the final clarity score from the consensus panel output.
 * 
 * Calculation methods:
 * - median: Use median of 3 evaluator scores per dimension (no disagreement)
 * - post-discussion: Use post-discussion scores (disagreement resolved by discussion)
 * - tiebreaker: Weight Arbiter 1.5x for disputed dimensions
 * 
 * @param input - Verdicts from evaluators, optional disagreement result and arbiter verdict
 * @returns ClarityScore with overall score, dimension breakdown, and consolidated critique
 */
export function calculateFinalScore(input: FinalScoreInput): ClarityScore {
  const { verdicts, disagreement, arbiterVerdict, discussionOccurred } = input;
  
  let consensusMethod: ClarityScore["consensusMethod"];
  let dimensionBreakdown: DimensionScore[];
  let needsHumanReview = false;
  let reviewReason: string | undefined;

  if (arbiterVerdict && disagreement?.hasDisagreement) {
    consensusMethod = "tiebreaker";
    dimensionBreakdown = calculateDimensionScoresWithArbiter(
      verdicts,
      arbiterVerdict,
      disagreement.disagreeingDimensions
    );
    needsHumanReview = true;
    reviewReason = `Tiebreaker invoked due to ${disagreement.disagreeingDimensions.length} disputed dimension(s): ${disagreement.disagreeingDimensions.join(", ")}. Max spread: ${disagreement.maxSpread.toFixed(1)}.`;
    
    console.log(`[Consensus Scorer] Using tiebreaker method (Arbiter weight: ${ARBITER_WEIGHT_MULTIPLIER}x for disputed dimensions)`);
  } else if (discussionOccurred && disagreement?.hasDisagreement) {
    consensusMethod = "post-discussion";
    dimensionBreakdown = calculateDimensionMedianScores(verdicts);
    
    console.log(`[Consensus Scorer] Using post-discussion method`);
  } else {
    consensusMethod = "median";
    dimensionBreakdown = calculateDimensionMedianScores(verdicts);
    
    console.log(`[Consensus Scorer] Using median method`);
  }

  const overallScore = calculateWeightedOverall(dimensionBreakdown);
  const critique = consolidateCritiques(verdicts, arbiterVerdict);
  
  const allVerdicts = arbiterVerdict ? [...verdicts, arbiterVerdict] : verdicts;
  const avgConfidence = allVerdicts.reduce((sum, v) => sum + v.confidence, 0) / allVerdicts.length;

  console.log(`[Consensus Scorer] Final score: ${overallScore.toFixed(1)} (method: ${consensusMethod})`);

  return {
    overallScore,
    dimensionBreakdown,
    critique,
    confidence: Math.round(avgConfidence * 100) / 100,
    evaluatorVerdicts: allVerdicts,
    consensusMethod,
    hasDisagreement: disagreement?.hasDisagreement ?? false,
    needsHumanReview,
    reviewReason,
    scoredAt: new Date().toISOString(),
  };
}
