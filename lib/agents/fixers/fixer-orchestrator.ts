/**
 * Fixer Orchestrator
 *
 * Deploys the appropriate fixer agents based on dimension scores from consensus evaluation.
 * Only deploys fixers for dimensions scoring below 7.0.
 */

import {
  FixerType,
  FixerInput,
  FixerResult,
  ConsensusResult,
  SuggestedEdit,
} from "@/lib/types/refinement";
import { BaseFixer } from "./base-fixer";
import { FirstPrinciplesFixer } from "./first-principles-fixer";
import { ConsistencyFixer } from "./consistency-fixer";
import { EvidenceFixer } from "./evidence-fixer";
import { AccessibilityFixer } from "./accessibility-fixer";
import { ObjectivityFixer } from "./objectivity-fixer";
import { FactualAccuracyFixer } from "./factual-accuracy-fixer";
import { BiasFixer } from "./bias-fixer";

const SCORE_THRESHOLD = 7.0;

/**
 * Result from the fixer orchestrator
 */
export interface OrchestratorResult {
  fixersDeployed: FixerType[];
  fixerResults: FixerResult[];
  allSuggestedEdits: SuggestedEdit[];
  totalProcessingTime: number;
}

/**
 * Input for the fixer orchestrator
 */
export interface OrchestratorInput {
  brief: string;
  consensusResult: ConsensusResult;
  sources?: Array<{
    url: string;
    title: string;
    content: string;
  }>;
}

/**
 * Mapping from FixerType to fixer class instance
 */
function createFixerInstance(fixerType: FixerType): BaseFixer {
  switch (fixerType) {
    case FixerType.firstPrinciplesCoherence:
      return new FirstPrinciplesFixer();
    case FixerType.internalConsistency:
      return new ConsistencyFixer();
    case FixerType.evidenceQuality:
      return new EvidenceFixer();
    case FixerType.accessibility:
      return new AccessibilityFixer();
    case FixerType.objectivity:
      return new ObjectivityFixer();
    case FixerType.factualAccuracy:
      return new FactualAccuracyFixer();
    case FixerType.biasDetection:
      return new BiasFixer();
    default:
      throw new Error(`Unknown fixer type: ${fixerType}`);
  }
}

/**
 * Determine which fixers need to be deployed based on dimension scores
 */
function getFixersToDeply(
  dimensionScores: ConsensusResult["dimensionScores"]
): FixerType[] {
  const fixersNeeded: FixerType[] = [];

  const allFixerTypes: FixerType[] = [
    FixerType.firstPrinciplesCoherence,
    FixerType.internalConsistency,
    FixerType.evidenceQuality,
    FixerType.accessibility,
    FixerType.objectivity,
    FixerType.factualAccuracy,
    FixerType.biasDetection,
  ];

  for (const fixerType of allFixerTypes) {
    const score = dimensionScores[fixerType];
    if (score < SCORE_THRESHOLD) {
      fixersNeeded.push(fixerType);
    }
  }

  return fixersNeeded;
}

/**
 * Orchestrate fixer agent deployment based on consensus scoring results
 */
export async function orchestrateFixes(
  input: OrchestratorInput
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const { brief, consensusResult, sources } = input;

  // Determine which fixers need to be deployed
  const fixersToDeply = getFixersToDeply(consensusResult.dimensionScores);

  console.log(
    `[FixerOrchestrator] Deploying ${fixersToDeply.length} fixers for dimensions scoring <${SCORE_THRESHOLD}`
  );
  console.log(
    `[FixerOrchestrator] Fixers: ${fixersToDeply.join(", ") || "none"}`
  );

  // Log dimension scores
  console.log(`[FixerOrchestrator] Dimension scores:`, {
    overall: consensusResult.overallScore,
    dimensions: Object.entries(consensusResult.dimensionScores).map(
      ([key, score]) => `${key}: ${score.toFixed(1)}`
    ),
  });

  if (fixersToDeply.length === 0) {
    console.log(
      `[FixerOrchestrator] No fixers needed - all dimensions scoring ≥${SCORE_THRESHOLD}`
    );
    return {
      fixersDeployed: [],
      fixerResults: [],
      allSuggestedEdits: [],
      totalProcessingTime: Date.now() - startTime,
    };
  }

  // Create fixer instances and inputs
  const fixerPromises = fixersToDeply.map((fixerType) => {
    const fixer = createFixerInstance(fixerType);
    const fixerInput: FixerInput = {
      brief,
      dimensionScore: consensusResult.dimensionScores[fixerType],
      critique: consensusResult.dimensionCritiques[fixerType] || "",
      sources,
    };
    return fixer.suggestEdits(fixerInput);
  });

  // Run all fixers in parallel
  const fixerResults = await Promise.all(fixerPromises);

  // Collect all suggested edits
  const allSuggestedEdits: SuggestedEdit[] = fixerResults.flatMap(
    (result) => result.suggestedEdits
  );

  const totalProcessingTime = Date.now() - startTime;

  // Log results
  console.log(
    `[FixerOrchestrator] Completed in ${totalProcessingTime}ms with ${allSuggestedEdits.length} total edits`
  );

  for (const result of fixerResults) {
    console.log(
      `[FixerOrchestrator] ${result.fixerType}: ${result.suggestedEdits.length} edits, confidence: ${result.confidence.toFixed(2)}, time: ${result.processingTime}ms`
    );
  }

  return {
    fixersDeployed: fixersToDeply,
    fixerResults,
    allSuggestedEdits,
    totalProcessingTime,
  };
}
