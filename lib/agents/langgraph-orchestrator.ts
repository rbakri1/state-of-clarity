/**
 * LangGraph Orchestrator
 *
 * Main pipeline orchestrator for brief generation.
 * Coordinates research, structure, narrative, consensus scoring, and refinement.
 *
 * Key responsibilities:
 * 1. Run initial brief generation pipeline
 * 2. Score the brief using consensus evaluation
 * 3. If score < 8.0, trigger refinement loop (up to 3 attempts)
 * 4. Set quality_warning if refinement fails to reach target score
 * 5. Store refinement_metadata with all attempt details
 * 6. Save final brief and score to database
 */

import { createServiceRoleClient, Database } from "@/lib/supabase/client";
import {
  ConsensusResult,
  RefinementResult,
  RefinementAttempt,
  FixerType,
  DimensionScores,
} from "@/lib/types/refinement";
import { refineUntilPassing, RefinementLoopInput } from "./refinement-loop";

const TARGET_SCORE = 8.0;

/**
 * Input for the pipeline orchestration
 */
export interface PipelineInput {
  question: string;
  userId?: string;
  sources?: Array<{
    url: string;
    title: string;
    content: string;
  }>;
}

/**
 * Generated brief content before scoring
 */
export interface GeneratedBrief {
  narrative: string;
  summaries: Record<string, string>;
  structuredData: Record<string, unknown>;
  sources: Array<{
    url: string;
    title: string;
    content: string;
  }>;
}

/**
 * Final result from the pipeline
 */
export interface PipelineResult {
  briefId: string;
  question: string;
  narrative: string;
  summaries: Record<string, string>;
  structuredData: Record<string, unknown>;
  clarityScore: number;
  qualityWarning: boolean;
  qualityWarningReason: string | null;
  refinementMetadata: RefinementMetadata | null;
  totalProcessingTime: number;
}

/**
 * Refinement metadata stored in the database
 */
export interface RefinementMetadata {
  refinementTriggered: boolean;
  initialScore: number;
  finalScore: number;
  attemptsCount: number;
  success: boolean;
  attempts: RefinementAttempt[];
  totalRefinementTime: number;
}

/**
 * Mock consensus scoring function
 * In production, this would call the 3-agent consensus evaluation panel
 */
export async function scoreWithConsensusPanel(
  brief: string
): Promise<ConsensusResult> {
  // TODO: Replace with actual consensus panel implementation
  // This is a placeholder that returns mock scores
  console.log("[Orchestrator] Scoring brief with consensus panel...");

  // Simulate scoring delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return mock consensus result for now
  // In production, this calls the 3-agent panel
  const mockDimensionScores: DimensionScores = {
    [FixerType.firstPrinciplesCoherence]: 7.5,
    [FixerType.internalConsistency]: 8.0,
    [FixerType.evidenceQuality]: 7.2,
    [FixerType.accessibility]: 8.5,
    [FixerType.objectivity]: 7.8,
    [FixerType.factualAccuracy]: 7.0,
    [FixerType.biasDetection]: 8.2,
  };

  const overallScore =
    Object.values(mockDimensionScores).reduce((a, b) => a + b, 0) / 7;

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    dimensionScores: mockDimensionScores,
    critique:
      "Brief demonstrates good structure but could improve on evidence quality and factual accuracy.",
    dimensionCritiques: {
      [FixerType.firstPrinciplesCoherence]:
        "Reasoning chain is mostly clear but some assumptions are implicit.",
      [FixerType.internalConsistency]:
        "Sections are well-aligned with minimal contradictions.",
      [FixerType.evidenceQuality]:
        "Some claims lack direct citation support.",
      [FixerType.accessibility]:
        "Language is clear and appropriate for target audience.",
      [FixerType.objectivity]:
        "Multiple perspectives are represented but could be more balanced.",
      [FixerType.factualAccuracy]:
        "Most facts are verifiable but some claims need hedging.",
      [FixerType.biasDetection]: "Minimal framing bias detected.",
    },
  };
}

/**
 * Run the full brief generation and refinement pipeline
 *
 * This is the main entry point for brief generation.
 * It coordinates:
 * 1. Initial brief generation (research, structure, narrative)
 * 2. Consensus scoring with 3-agent panel
 * 3. Refinement loop if score < 8.0
 * 4. Database persistence with quality warnings
 */
export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const startTime = Date.now();
  const { question, userId, sources } = input;

  console.log(`[Orchestrator] Starting pipeline for question: "${question}"`);

  // Step 1: Generate initial brief
  // TODO: Integrate with actual brief generation agents (research, structure, summary, narrative)
  // For now, we use placeholder content that would come from the upstream agents
  const generatedBrief = await generateInitialBrief(question, sources);

  console.log("[Orchestrator] Initial brief generated");

  // Step 2: Score with consensus panel
  const initialConsensusResult = await scoreWithConsensusPanel(
    generatedBrief.narrative
  );

  console.log(
    `[Orchestrator] Initial score: ${initialConsensusResult.overallScore.toFixed(1)}/10`
  );

  // Step 3: Determine if refinement is needed
  let finalBrief = generatedBrief.narrative;
  let finalScore = initialConsensusResult.overallScore;
  let qualityWarning = false;
  let qualityWarningReason: string | null = null;
  let refinementMetadata: RefinementMetadata | null = null;

  if (initialConsensusResult.overallScore < TARGET_SCORE) {
    console.log(
      `[Orchestrator] Score below ${TARGET_SCORE}, triggering refinement loop...`
    );

    // Step 4: Run refinement loop
    const refinementInput: RefinementLoopInput = {
      brief: generatedBrief.narrative,
      initialConsensusResult,
      sources: generatedBrief.sources,
      scoringFunction: scoreWithConsensusPanel,
      maxAttempts: 3,
    };

    const refinementResult = await refineUntilPassing(refinementInput);

    // Update with refinement results
    finalBrief = refinementResult.finalBrief;
    finalScore = refinementResult.finalScore;

    // Step 5: Set quality warning if refinement failed
    if (!refinementResult.success) {
      qualityWarning = true;
      qualityWarningReason =
        refinementResult.warningReason ||
        `Brief scored ${finalScore.toFixed(1)}/10 after ${refinementResult.attempts.length} refinement attempts.`;
      console.log(
        `[Orchestrator] Refinement failed. Quality warning: ${qualityWarningReason}`
      );
    } else {
      console.log(
        `[Orchestrator] Refinement successful. Final score: ${finalScore.toFixed(1)}/10`
      );
    }

    // Store refinement metadata
    refinementMetadata = {
      refinementTriggered: true,
      initialScore: initialConsensusResult.overallScore,
      finalScore: refinementResult.finalScore,
      attemptsCount: refinementResult.attempts.length,
      success: refinementResult.success,
      attempts: refinementResult.attempts,
      totalRefinementTime: refinementResult.totalProcessingTime,
    };
  } else {
    console.log(
      `[Orchestrator] Score already meets target (≥${TARGET_SCORE}). No refinement needed.`
    );
    refinementMetadata = {
      refinementTriggered: false,
      initialScore: initialConsensusResult.overallScore,
      finalScore: initialConsensusResult.overallScore,
      attemptsCount: 0,
      success: true,
      attempts: [],
      totalRefinementTime: 0,
    };
  }

  // Step 6: Save to database
  const briefId = await saveBriefToDatabase({
    question,
    userId,
    narrative: finalBrief,
    summaries: generatedBrief.summaries,
    structuredData: generatedBrief.structuredData,
    clarityScore: finalScore,
    qualityWarning,
    qualityWarningReason,
    refinementMetadata,
  });

  const totalProcessingTime = Date.now() - startTime;
  console.log(
    `[Orchestrator] Pipeline complete in ${(totalProcessingTime / 1000).toFixed(1)}s. Brief ID: ${briefId}`
  );

  return {
    briefId,
    question,
    narrative: finalBrief,
    summaries: generatedBrief.summaries,
    structuredData: generatedBrief.structuredData,
    clarityScore: finalScore,
    qualityWarning,
    qualityWarningReason,
    refinementMetadata,
    totalProcessingTime,
  };
}

/**
 * Generate initial brief content
 * TODO: Replace with actual agent implementations
 */
async function generateInitialBrief(
  question: string,
  sources?: Array<{ url: string; title: string; content: string }>
): Promise<GeneratedBrief> {
  // Placeholder - in production this calls research, structure, summary, and narrative agents
  return {
    narrative: `This is a placeholder narrative for the question: "${question}". In production, this would be generated by the narrative agent based on structured data from the research and structure agents.`,
    summaries: {
      child: "Simple explanation for children.",
      teen: "More detailed explanation for teenagers.",
      undergrad: "Academic explanation for undergraduates.",
      postdoc: "Expert-level explanation for postdocs.",
    },
    structuredData: {
      definitions: [],
      factors: [],
      policies: [],
      consequences: [],
    },
    sources: sources || [],
  };
}

/**
 * Save brief to database with all refinement data
 */
async function saveBriefToDatabase(data: {
  question: string;
  userId?: string;
  narrative: string;
  summaries: Record<string, string>;
  structuredData: Record<string, unknown>;
  clarityScore: number;
  qualityWarning: boolean;
  qualityWarningReason: string | null;
  refinementMetadata: RefinementMetadata | null;
}): Promise<string> {
  const supabase = createServiceRoleClient();

  const insertData = {
    question: data.question,
    user_id: data.userId || null,
    narrative: data.narrative,
    summaries: data.summaries,
    structured_data: data.structuredData,
    clarity_score: data.clarityScore,
    quality_warning: data.qualityWarning,
    quality_warning_reason: data.qualityWarningReason,
    refinement_metadata: data.refinementMetadata,
    metadata: {
      generatedAt: new Date().toISOString(),
      version: "1.0",
    },
  } as Database["public"]["Tables"]["briefs"]["Insert"];

  const { data: brief, error } = await supabase
    .from("briefs")
    .insert(insertData as never)
    .select("id")
    .single() as { data: { id: string } | null; error: Error | null };

  if (error || !brief) {
    console.error("[Orchestrator] Failed to save brief:", error);
    throw new Error(`Failed to save brief to database: ${error?.message || "No data returned"}`);
  }

  return brief.id;
}

/**
 * Run the pipeline with an existing brief (for re-scoring/re-refinement)
 *
 * Use this when you already have a brief and want to score/refine it.
 */
export async function runPipelineWithExistingBrief(input: {
  briefId: string;
  narrative: string;
  sources?: Array<{ url: string; title: string; content: string }>;
}): Promise<RefinementResult> {
  const { narrative, sources } = input;

  console.log(`[Orchestrator] Re-scoring existing brief: ${input.briefId}`);

  // Score with consensus panel
  const consensusResult = await scoreWithConsensusPanel(narrative);

  console.log(
    `[Orchestrator] Current score: ${consensusResult.overallScore.toFixed(1)}/10`
  );

  // If already passing, return immediately
  if (consensusResult.overallScore >= TARGET_SCORE) {
    return {
      finalBrief: narrative,
      finalScore: consensusResult.overallScore,
      success: true,
      attempts: [],
      totalProcessingTime: 0,
    };
  }

  // Run refinement
  const refinementInput: RefinementLoopInput = {
    brief: narrative,
    initialConsensusResult: consensusResult,
    sources,
    scoringFunction: scoreWithConsensusPanel,
    maxAttempts: 3,
  };

  return refineUntilPassing(refinementInput);
}
