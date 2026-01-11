/**
 * Consensus Scoring Logger
 *
 * Logs detailed consensus scoring metrics to the agent_execution_logs table.
 * Provides observability into evaluator verdicts, disagreement detection,
 * discussion rounds, tiebreaker decisions, and final score calculations.
 */

import { createServiceRoleClient } from '../supabase/client';
import type { EvaluatorVerdict, DisagreementResult, DimensionScore, ClarityScore } from '../types/clarity-scoring';
import type { DiscussionRoundOutput } from './discussion-round-agent';
import type { TiebreakerOutput } from './tiebreaker-agent';

interface BaseLogEntry {
  briefId: string | null;
  agentName: string;
  startedAt: Date;
  durationMs: number;
  status: 'completed' | 'failed';
  errorMessage?: string;
}

interface EvaluatorVerdictLogMetadata {
  type: 'evaluator_verdict';
  evaluatorRole: string;
  overallScore: number;
  confidence: number;
  dimensionScores: Record<string, number>;
  issueCount: number;
  issues: Array<{
    dimension: string;
    severity: string;
    description: string;
  }>;
  critiqueLength: number;
  retryCount?: number;
}

interface DisagreementLogMetadata {
  type: 'disagreement_detection';
  hasDisagreement: boolean;
  disagreeingDimensions: string[];
  maxSpread: number;
  evaluatorPositions: Array<{
    evaluator: string;
    overallScore: number;
    divergentDimensions: Array<{ dimension: string; score: number }>;
  }>;
}

interface DiscussionRoundLogMetadata {
  type: 'discussion_round';
  changesCount: number;
  revisionsByEvaluator: Record<string, number>;
  discussionSummaryLength: number;
  resolvedDisagreement: boolean;
}

interface TiebreakerLogMetadata {
  type: 'tiebreaker';
  arbiterScore: number;
  disputedDimensionsResolved: string[];
  resolutionSummaryLength: number;
}

interface FinalScoreLogMetadata {
  type: 'final_consensus_score';
  overallScore: number;
  consensusMethod: string;
  confidence: number;
  dimensionBreakdown: Record<string, number>;
  hasDisagreement: boolean;
  needsHumanReview: boolean;
  reviewReason?: string;
  evaluatorCount: number;
  issueCount: number;
}

type ScoringLogMetadata =
  | EvaluatorVerdictLogMetadata
  | DisagreementLogMetadata
  | DiscussionRoundLogMetadata
  | TiebreakerLogMetadata
  | FinalScoreLogMetadata;

async function insertLogEntry(
  entry: BaseLogEntry,
  metadata: ScoringLogMetadata
): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase
      .from('agent_execution_logs') as any)
      .insert({
        brief_id: entry.briefId,
        agent_name: entry.agentName,
        started_at: entry.startedAt.toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: entry.durationMs,
        status: entry.status,
        error_message: entry.errorMessage,
        metadata,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[ConsensusScoringLogger] Failed to insert log:`, error);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error(`[ConsensusScoringLogger] Error inserting log:`, err);
    return null;
  }
}

/**
 * Log an individual evaluator's verdict to the execution logs
 */
export async function logEvaluatorVerdict(
  briefId: string | null,
  verdict: EvaluatorVerdict,
  durationMs: number,
  retryCount?: number
): Promise<void> {
  const dimensionScores: Record<string, number> = {};
  for (const ds of verdict.dimensionScores) {
    dimensionScores[ds.dimension] = ds.score;
  }

  const metadata: EvaluatorVerdictLogMetadata = {
    type: 'evaluator_verdict',
    evaluatorRole: verdict.evaluatorRole,
    overallScore: verdict.overallScore,
    confidence: verdict.confidence,
    dimensionScores,
    issueCount: verdict.issues.length,
    issues: verdict.issues.map(i => ({
      dimension: i.dimension,
      severity: i.severity,
      description: i.description.slice(0, 200),
    })),
    critiqueLength: verdict.critique.length,
    retryCount,
  };

  console.log(`[ConsensusScoringLogger] Logging ${verdict.evaluatorRole} verdict: score=${verdict.overallScore.toFixed(1)}`);

  await insertLogEntry(
    {
      briefId,
      agentName: `Consensus Evaluator (${verdict.evaluatorRole})`,
      startedAt: new Date(Date.now() - durationMs),
      durationMs,
      status: 'completed',
    },
    metadata
  );
}

/**
 * Log all evaluator verdicts from a parallel evaluation run
 */
export async function logAllEvaluatorVerdicts(
  briefId: string | null,
  verdicts: EvaluatorVerdict[],
  evaluatorDurations: Array<{ role: string; durationMs: number }>
): Promise<void> {
  const promises = verdicts.map(verdict => {
    const duration = evaluatorDurations.find(d => d.role === verdict.evaluatorRole)?.durationMs ?? 0;
    return logEvaluatorVerdict(briefId, verdict, duration);
  });

  await Promise.all(promises);
  console.log(`[ConsensusScoringLogger] Logged ${verdicts.length} evaluator verdicts`);
}

/**
 * Log disagreement detection results
 */
export async function logDisagreementDetection(
  briefId: string | null,
  disagreement: DisagreementResult,
  durationMs: number
): Promise<void> {
  const metadata: DisagreementLogMetadata = {
    type: 'disagreement_detection',
    hasDisagreement: disagreement.hasDisagreement,
    disagreeingDimensions: disagreement.disagreeingDimensions,
    maxSpread: disagreement.maxSpread,
    evaluatorPositions: disagreement.evaluatorPositions,
  };

  console.log(`[ConsensusScoringLogger] Logging disagreement detection: hasDisagreement=${disagreement.hasDisagreement}, maxSpread=${disagreement.maxSpread.toFixed(1)}`);

  await insertLogEntry(
    {
      briefId,
      agentName: 'Consensus Disagreement Detection',
      startedAt: new Date(Date.now() - durationMs),
      durationMs,
      status: 'completed',
    },
    metadata
  );
}

/**
 * Log discussion round output
 */
export async function logDiscussionRound(
  briefId: string | null,
  output: DiscussionRoundOutput,
  resolvedDisagreement: boolean
): Promise<void> {
  const revisionsByEvaluator: Record<string, number> = {};
  for (const verdict of output.revisedVerdicts) {
    const revisedCount = verdict.dimensionScores.filter((_, i) => {
      // Count dimensions that differ from original (approximation)
      return true; // Since we don't have original here, count all
    }).length;
    revisionsByEvaluator[verdict.evaluatorRole] = revisedCount;
  }

  const metadata: DiscussionRoundLogMetadata = {
    type: 'discussion_round',
    changesCount: output.changesCount,
    revisionsByEvaluator,
    discussionSummaryLength: output.discussionSummary.length,
    resolvedDisagreement,
  };

  console.log(`[ConsensusScoringLogger] Logging discussion round: changes=${output.changesCount}, resolved=${resolvedDisagreement}`);

  await insertLogEntry(
    {
      briefId,
      agentName: 'Consensus Discussion Round',
      startedAt: new Date(Date.now() - output.durationMs),
      durationMs: output.durationMs,
      status: 'completed',
    },
    metadata
  );
}

/**
 * Log tiebreaker verdict
 */
export async function logTiebreakerVerdict(
  briefId: string | null,
  output: TiebreakerOutput,
  disputedDimensions: string[]
): Promise<void> {
  const metadata: TiebreakerLogMetadata = {
    type: 'tiebreaker',
    arbiterScore: output.verdict.overallScore,
    disputedDimensionsResolved: disputedDimensions,
    resolutionSummaryLength: output.resolutionSummary.length,
  };

  console.log(`[ConsensusScoringLogger] Logging tiebreaker: arbiterScore=${output.verdict.overallScore.toFixed(1)}, dimensions=${disputedDimensions.join(', ')}`);

  await insertLogEntry(
    {
      briefId,
      agentName: 'Consensus Tiebreaker (Arbiter)',
      startedAt: new Date(Date.now() - output.durationMs),
      durationMs: output.durationMs,
      status: 'completed',
    },
    metadata
  );
}

/**
 * Log the final consensus score calculation
 */
export async function logFinalConsensusScore(
  briefId: string | null,
  clarityScore: ClarityScore,
  totalDurationMs: number,
  evaluatorCount: number
): Promise<void> {
  const dimensionBreakdown: Record<string, number> = {};
  for (const ds of clarityScore.dimensionBreakdown) {
    dimensionBreakdown[ds.dimension] = ds.score;
  }

  const metadata: FinalScoreLogMetadata = {
    type: 'final_consensus_score',
    overallScore: clarityScore.overallScore,
    consensusMethod: clarityScore.consensusMethod,
    confidence: clarityScore.confidence,
    dimensionBreakdown,
    hasDisagreement: clarityScore.hasDisagreement,
    needsHumanReview: clarityScore.needsHumanReview,
    reviewReason: clarityScore.reviewReason,
    evaluatorCount,
    issueCount: clarityScore.evaluatorVerdicts.reduce((sum, v) => sum + v.issues.length, 0),
  };

  console.log(`[ConsensusScoringLogger] Logging final score: ${clarityScore.overallScore.toFixed(1)}/10 (method: ${clarityScore.consensusMethod})`);

  await insertLogEntry(
    {
      briefId,
      agentName: 'Consensus Final Score Calculator',
      startedAt: new Date(Date.now() - totalDurationMs),
      durationMs: totalDurationMs,
      status: 'completed',
    },
    metadata
  );
}

export interface FullConsensusScoringLog {
  briefId: string | null;
  verdicts: EvaluatorVerdict[];
  evaluatorDurations: Array<{ role: string; durationMs: number }>;
  disagreement: DisagreementResult;
  disagreementDetectionDurationMs: number;
  discussionRound?: DiscussionRoundOutput;
  discussionResolvedDisagreement?: boolean;
  tiebreaker?: TiebreakerOutput;
  disputedDimensions?: string[];
  clarityScore: ClarityScore;
  totalDurationMs: number;
}

/**
 * Log all consensus scoring metrics in one call (convenience function)
 *
 * This is useful when you want to log everything at once rather than
 * calling individual logging functions throughout the scoring process.
 */
export async function logFullConsensusScoringRun(
  log: FullConsensusScoringLog
): Promise<void> {
  console.log(`[ConsensusScoringLogger] Logging full consensus scoring run for brief: ${log.briefId}`);

  const promises: Promise<void>[] = [];

  // Log all evaluator verdicts
  promises.push(logAllEvaluatorVerdicts(
    log.briefId,
    log.verdicts,
    log.evaluatorDurations
  ));

  // Log disagreement detection
  promises.push(logDisagreementDetection(
    log.briefId,
    log.disagreement,
    log.disagreementDetectionDurationMs
  ));

  // Log discussion round if it occurred
  if (log.discussionRound) {
    promises.push(logDiscussionRound(
      log.briefId,
      log.discussionRound,
      log.discussionResolvedDisagreement ?? false
    ));
  }

  // Log tiebreaker if it was invoked
  if (log.tiebreaker && log.disputedDimensions) {
    promises.push(logTiebreakerVerdict(
      log.briefId,
      log.tiebreaker,
      log.disputedDimensions
    ));
  }

  // Log final consensus score
  promises.push(logFinalConsensusScore(
    log.briefId,
    log.clarityScore,
    log.totalDurationMs,
    log.verdicts.length
  ));

  // Execute all logging in parallel (non-blocking)
  await Promise.all(promises);

  console.log(`[ConsensusScoringLogger] Completed logging for brief: ${log.briefId}`);
}
