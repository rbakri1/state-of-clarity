/**
 * Refinement Loop
 *
 * Attempts to improve a brief through iterative refinement cycles.
 * Deploys fixer agents, reconciles edits, and re-scores until the brief
 * reaches the target score (≥8.0) or max attempts (3) are exhausted.
 */

import {
  ConsensusResult,
  RefinementResult,
  RefinementAttempt,
  FixerType,
  ScoreBeforeAfter,
} from "@/lib/types/refinement";
import {
  orchestrateFixes,
  OrchestratorInput,
} from "@/lib/agents/fixers/fixer-orchestrator";
import {
  reconcileEdits,
  ReconciliationInput,
} from "@/lib/agents/fixers/edit-reconciliation-agent";
import {
  logRefinementAttempt,
  logRefinementSummary,
  logOrchestratorExecution,
  logReconciliationExecution,
} from "@/lib/agents/execution-logger";

const TARGET_SCORE = 8.0;
const MAX_ATTEMPTS = 3;

/**
 * Input for the refinement loop
 */
export interface RefinementLoopInput {
  brief: string;
  briefId?: string;
  initialConsensusResult: ConsensusResult;
  sources?: Array<{
    url: string;
    title: string;
    content: string;
  }>;
  scoringFunction: (brief: string) => Promise<ConsensusResult>;
  maxAttempts?: number;
}

/**
 * Track dimension score changes across refinement attempts
 */
function trackDimensionScoreChanges(
  before: ConsensusResult,
  after: ConsensusResult
): Record<FixerType, { before: number; after: number }> {
  const allFixerTypes: FixerType[] = [
    FixerType.firstPrinciplesCoherence,
    FixerType.internalConsistency,
    FixerType.evidenceQuality,
    FixerType.accessibility,
    FixerType.objectivity,
    FixerType.factualAccuracy,
    FixerType.biasDetection,
  ];

  const changes: Record<FixerType, { before: number; after: number }> = {} as Record<
    FixerType,
    { before: number; after: number }
  >;

  for (const fixerType of allFixerTypes) {
    changes[fixerType] = {
      before: before.dimensionScores[fixerType],
      after: after.dimensionScores[fixerType],
    };
  }

  return changes;
}

/**
 * Generate a warning reason if refinement failed to reach target score
 */
function generateWarningReason(
  finalScore: number,
  attempts: RefinementAttempt[]
): string {
  const lastAttempt = attempts[attempts.length - 1];
  const lowestDimensions = Object.entries(lastAttempt.scoreBeforeAfter.dimensionScores || {})
    .filter(([, scores]) => scores.after < 7.0)
    .sort((a, b) => a[1].after - b[1].after)
    .slice(0, 3)
    .map(([dim]) => dim);

  if (lowestDimensions.length > 0) {
    return `Brief scored ${finalScore.toFixed(1)}/10 after ${attempts.length} refinement attempts. Lowest dimensions: ${lowestDimensions.join(", ")}.`;
  }

  return `Brief scored ${finalScore.toFixed(1)}/10 after ${attempts.length} refinement attempts.`;
}

/**
 * Main refinement loop function
 *
 * Iteratively refines a brief until it reaches the target score (≥8.0)
 * or max attempts (default 3) are exhausted.
 */
export async function refineUntilPassing(
  input: RefinementLoopInput
): Promise<RefinementResult> {
  const startTime = Date.now();
  const { brief, briefId, initialConsensusResult, sources, scoringFunction } = input;
  const maxAttempts = input.maxAttempts ?? MAX_ATTEMPTS;

  let currentBrief = brief;
  let currentConsensusResult = initialConsensusResult;
  const attempts: RefinementAttempt[] = [];

  console.log(
    `[RefinementLoop] Starting refinement. Initial score: ${currentConsensusResult.overallScore.toFixed(1)}/10`
  );

  // Check if already passing
  if (currentConsensusResult.overallScore >= TARGET_SCORE) {
    console.log(
      `[RefinementLoop] Brief already meets target score (≥${TARGET_SCORE}). No refinement needed.`
    );
    return {
      finalBrief: currentBrief,
      finalScore: currentConsensusResult.overallScore,
      success: true,
      attempts: [],
      totalProcessingTime: Date.now() - startTime,
    };
  }

  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
    const attemptStartTime = Date.now();
    console.log(
      `[RefinementLoop] Starting attempt ${attemptNumber}/${maxAttempts}`
    );

    const scoreBefore = currentConsensusResult.overallScore;

    // Step 1: Deploy fixer agents based on dimension scores
    const orchestratorInput: OrchestratorInput = {
      brief: currentBrief,
      consensusResult: currentConsensusResult,
      sources,
    };

    const orchestratorStartTime = Date.now();
    const orchestratorResult = await orchestrateFixes(orchestratorInput);
    const orchestratorDuration = Date.now() - orchestratorStartTime;

    const allFixerTypes: FixerType[] = [
      FixerType.firstPrinciplesCoherence,
      FixerType.internalConsistency,
      FixerType.evidenceQuality,
      FixerType.accessibility,
      FixerType.objectivity,
      FixerType.factualAccuracy,
      FixerType.biasDetection,
    ];
    const fixersSkipped = allFixerTypes.filter(
      (ft) => !orchestratorResult.fixersDeployed.includes(ft)
    );
    const dimensionScoresMap: Record<string, number> = {};
    for (const ft of allFixerTypes) {
      dimensionScoresMap[ft] = currentConsensusResult.dimensionScores[ft];
    }

    await logOrchestratorExecution(briefId, {
      fixersDeployed: orchestratorResult.fixersDeployed,
      fixersSkipped,
      totalEditsCollected: orchestratorResult.allSuggestedEdits.length,
      processingTimeMs: orchestratorDuration,
      dimensionScores: dimensionScoresMap,
      status: "success",
    });

    console.log(
      `[RefinementLoop] Attempt ${attemptNumber}: Deployed ${orchestratorResult.fixersDeployed.length} fixers, got ${orchestratorResult.allSuggestedEdits.length} edit suggestions`
    );

    // If no fixers were deployed or no edits suggested, skip to next attempt
    if (
      orchestratorResult.fixersDeployed.length === 0 ||
      orchestratorResult.allSuggestedEdits.length === 0
    ) {
      console.log(
        `[RefinementLoop] Attempt ${attemptNumber}: No edits to apply, ending refinement`
      );
      break;
    }

    // Step 2: Reconcile and apply edits
    const reconciliationInput: ReconciliationInput = {
      originalBrief: currentBrief,
      fixerResults: orchestratorResult.fixerResults,
    };

    const reconciliationStartTime = Date.now();
    const reconciliationResult = await reconcileEdits(reconciliationInput);
    const reconciliationDuration = Date.now() - reconciliationStartTime;

    const totalEditsReceived = orchestratorResult.allSuggestedEdits.length;
    await logReconciliationExecution(briefId, {
      editsReceived: totalEditsReceived,
      editsApplied: reconciliationResult.editsApplied.length,
      editsSkipped: reconciliationResult.editsSkipped.length,
      conflictsResolved: reconciliationResult.editsSkipped.length,
      processingTimeMs: reconciliationDuration,
      status: "success",
    });

    console.log(
      `[RefinementLoop] Attempt ${attemptNumber}: Applied ${reconciliationResult.editsApplied.length} edits, skipped ${reconciliationResult.editsSkipped.length}`
    );

    // If no edits were applied, skip to next attempt
    if (
      reconciliationResult.editsApplied.length === 0 ||
      !reconciliationResult.revisedBrief
    ) {
      console.log(
        `[RefinementLoop] Attempt ${attemptNumber}: No edits applied, ending refinement`
      );
      break;
    }

    // Update current brief
    currentBrief = reconciliationResult.revisedBrief;

    // Step 3: Re-score the revised brief
    console.log(
      `[RefinementLoop] Attempt ${attemptNumber}: Re-scoring revised brief...`
    );
    const previousConsensusResult = currentConsensusResult;
    currentConsensusResult = await scoringFunction(currentBrief);
    const scoreAfter = currentConsensusResult.overallScore;

    // Track dimension score changes
    const dimensionScoreChanges = trackDimensionScoreChanges(
      previousConsensusResult,
      currentConsensusResult
    );

    const scoreChange = scoreAfter - scoreBefore;
    console.log(
      `[RefinementLoop] Attempt ${attemptNumber}: Score changed from ${scoreBefore.toFixed(1)} to ${scoreAfter.toFixed(1)} (${scoreChange >= 0 ? "+" : ""}${scoreChange.toFixed(1)})`
    );

    // Record this attempt
    const attemptRecord: RefinementAttempt = {
      attemptNumber,
      fixersDeployed: orchestratorResult.fixersDeployed,
      editsMade: reconciliationResult.editsApplied,
      editsSkipped: reconciliationResult.editsSkipped,
      scoreBeforeAfter: {
        before: scoreBefore,
        after: scoreAfter,
        dimensionScores: dimensionScoreChanges,
      },
      processingTime: Date.now() - attemptStartTime,
    };
    attempts.push(attemptRecord);

    await logRefinementAttempt(briefId, attemptRecord);

    // Check if we've reached the target score
    if (scoreAfter >= TARGET_SCORE) {
      console.log(
        `[RefinementLoop] Target score (≥${TARGET_SCORE}) reached after ${attemptNumber} attempt(s)`
      );

      await logRefinementSummary(briefId, {
        attempts,
        initialScore: initialConsensusResult.overallScore,
        finalScore: scoreAfter,
        success: true,
        totalProcessingTimeMs: Date.now() - startTime,
      });

      return {
        finalBrief: currentBrief,
        finalScore: scoreAfter,
        success: true,
        attempts,
        totalProcessingTime: Date.now() - startTime,
      };
    }
  }

  // Max attempts exhausted without reaching target
  const finalScore = currentConsensusResult.overallScore;
  const warningReason = attempts.length > 0 
    ? generateWarningReason(finalScore, attempts) 
    : `Brief scored ${finalScore.toFixed(1)}/10, no refinement attempts could be completed.`;

  console.log(
    `[RefinementLoop] Max attempts (${maxAttempts}) exhausted. Final score: ${finalScore.toFixed(1)}/10`
  );

  await logRefinementSummary(briefId, {
    attempts,
    initialScore: initialConsensusResult.overallScore,
    finalScore,
    success: false,
    totalProcessingTimeMs: Date.now() - startTime,
    warningReason,
  });

  return {
    finalBrief: currentBrief,
    finalScore,
    success: false,
    attempts,
    totalProcessingTime: Date.now() - startTime,
    warningReason,
  };
}
