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
  PrioritizedIssue,
  Issue,
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

export interface AggregatedCritique {
  issues: PrioritizedIssue[];
  summary: string;
  topPriority: PrioritizedIssue | null;
}

interface IssueWithMeta {
  issue: Issue;
  evaluatorCount: number;
  scoreImpact: number;
}

function normalizeIssueText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function areIssuesSimilar(a: string, b: string): boolean {
  const normA = normalizeIssueText(a);
  const normB = normalizeIssueText(b);
  
  if (normA === normB) return true;
  
  const wordsA = new Set(normA.split(/\s+/));
  const wordsB = new Set(normB.split(/\s+/));
  
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  
  const jaccardSimilarity = intersection.size / union.size;
  return jaccardSimilarity > 0.6;
}

function severityToScore(severity: Issue["severity"]): number {
  switch (severity) {
    case "high": return 3;
    case "medium": return 2;
    case "low": return 1;
  }
}

function priorityFromScore(score: number): PrioritizedIssue["priority"] {
  if (score >= 8) return "critical";
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function mergeIssues(issues: Issue[], existingIssue: Issue): Issue {
  const highestSeverity = issues.reduce((max, i) => {
    return severityToScore(i.severity) > severityToScore(max) ? i.severity : max;
  }, existingIssue.severity);
  
  const bestQuote = [...issues, existingIssue]
    .map(i => i.quote)
    .filter((q): q is string => !!q)
    .sort((a, b) => b.length - a.length)[0];
  
  const bestFix = [...issues, existingIssue]
    .map(i => i.suggestedFix)
    .filter((f): f is string => !!f)
    .sort((a, b) => b.length - a.length)[0];

  return {
    dimension: existingIssue.dimension,
    severity: highestSeverity,
    description: existingIssue.description,
    quote: bestQuote,
    suggestedFix: bestFix,
  };
}

/**
 * Aggregate critiques from all evaluators for refinement agent.
 * 
 * Process:
 * 1. Merge issues from all evaluators, deduplicate similar issues
 * 2. Prioritize by: agreement (all 3 flagged it), severity (score impact), actionability
 * 3. Format as structured list: dimension, issue, suggested fix, priority
 * 4. Limit to top 5 issues to keep refinement focused
 * 5. Include specific quotes/sections that need attention
 * 
 * @param verdicts - Array of evaluator verdicts to aggregate
 * @returns AggregatedCritique with prioritized issues and summary
 */
export function aggregateCritiques(verdicts: EvaluatorVerdict[]): AggregatedCritique {
  if (verdicts.length === 0) {
    return {
      issues: [],
      summary: "No evaluator verdicts available.",
      topPriority: null,
    };
  }

  const allIssues = verdicts.flatMap(v => v.issues);
  
  if (allIssues.length === 0) {
    return {
      issues: [],
      summary: "No issues flagged by evaluators.",
      topPriority: null,
    };
  }

  const groupedIssues: Map<string, IssueWithMeta> = new Map();
  
  for (const issue of allIssues) {
    let foundSimilar = false;
    
    for (const [key, existing] of groupedIssues) {
      if (existing.issue.dimension === issue.dimension && 
          areIssuesSimilar(existing.issue.description, issue.description)) {
        groupedIssues.set(key, {
          issue: mergeIssues([issue], existing.issue),
          evaluatorCount: existing.evaluatorCount + 1,
          scoreImpact: Math.max(existing.scoreImpact, severityToScore(issue.severity) * getDimensionWeight(issue.dimension)),
        });
        foundSimilar = true;
        break;
      }
    }
    
    if (!foundSimilar) {
      const key = `${issue.dimension}-${normalizeIssueText(issue.description).slice(0, 50)}`;
      groupedIssues.set(key, {
        issue,
        evaluatorCount: 1,
        scoreImpact: severityToScore(issue.severity) * getDimensionWeight(issue.dimension),
      });
    }
  }

  const evaluatorCount = verdicts.length;
  const scoredIssues: Array<IssueWithMeta & { priorityScore: number }> = [];
  
  for (const meta of groupedIssues.values()) {
    const agreementScore = (meta.evaluatorCount / evaluatorCount) * 4;
    const severityScore = severityToScore(meta.issue.severity);
    const actionabilityScore = meta.issue.suggestedFix ? 2 : 0;
    
    const priorityScore = agreementScore + severityScore + actionabilityScore + (meta.scoreImpact * 5);
    
    scoredIssues.push({
      ...meta,
      priorityScore,
    });
  }

  scoredIssues.sort((a, b) => b.priorityScore - a.priorityScore);

  const topIssues = scoredIssues.slice(0, 5);

  const prioritizedIssues: PrioritizedIssue[] = topIssues.map((meta) => ({
    dimension: meta.issue.dimension,
    issue: meta.issue.description,
    suggestedFix: meta.issue.suggestedFix ?? "Review and address this concern",
    priority: priorityFromScore(meta.priorityScore),
    quote: meta.issue.quote,
    agreedByEvaluators: meta.evaluatorCount,
  }));

  const criticalCount = prioritizedIssues.filter(i => i.priority === "critical").length;
  const highCount = prioritizedIssues.filter(i => i.priority === "high").length;
  const mediumCount = prioritizedIssues.filter(i => i.priority === "medium").length;
  
  let summary: string;
  if (prioritizedIssues.length === 0) {
    summary = "No actionable issues identified.";
  } else if (criticalCount > 0) {
    summary = `${criticalCount} critical issue(s) require immediate attention. ${highCount} high-priority and ${mediumCount} medium-priority issues also flagged.`;
  } else if (highCount > 0) {
    summary = `${highCount} high-priority issue(s) should be addressed. ${mediumCount} medium-priority issues also noted.`;
  } else {
    summary = `${prioritizedIssues.length} issue(s) identified for refinement, mostly minor improvements.`;
  }

  console.log(`[Consensus Scorer] Aggregated ${allIssues.length} issues into ${prioritizedIssues.length} prioritized items`);
  console.log(`[Consensus Scorer] Summary: ${summary}`);

  return {
    issues: prioritizedIssues,
    summary,
    topPriority: prioritizedIssues[0] ?? null,
  };
}
