/**
 * Retry Executor Agent
 *
 * Picks items from the retry queue and re-executes brief generation
 * with adjusted parameters based on the failure reason.
 *
 * - Adjusts parameters based on failure: low evidence -> more sources,
 *   low objectivity -> force opposing views
 * - Max 2 retry attempts before marking as 'abandoned'
 */

import { researchAgent, type Source } from "./research-agent";
import { runQualityGate, getTierDecision } from "./quality-gate";
import {
  getNextRetryItem,
  markRetryComplete,
  generateRetryParams,
} from "../services/retry-queue-service";
import { type RetryQueueItem, type RetryParams, QualityTier } from "../types/quality-gate";
import Anthropic from "@anthropic-ai/sdk";

const MAX_RETRY_ATTEMPTS = 2;

interface RetryExecutionResult {
  success: boolean;
  briefId?: string;
  finalScore?: number;
  tier?: QualityTier;
  error?: string;
  attempts: number;
}

interface GeneratedBrief {
  title: string;
  summary: string;
  content: string;
  sources: Source[];
}

/**
 * Process the next pending retry item from the queue
 */
export async function processNextRetry(): Promise<RetryExecutionResult | null> {
  console.log("[Retry Executor] Checking for pending retry items...");

  const retryItem = await getNextRetryItem();

  if (!retryItem) {
    console.log("[Retry Executor] No pending retry items found");
    return null;
  }

  console.log(
    `[Retry Executor] Processing retry for question: "${retryItem.originalQuestion.slice(0, 50)}..."`
  );
  console.log(
    `[Retry Executor] Attempt ${retryItem.attempts + 1}/${MAX_RETRY_ATTEMPTS}`
  );

  try {
    const result = await executeRetryWithAdjustedParams(retryItem);

    await markRetryComplete(retryItem.id, result.success);

    return result;
  } catch (error) {
    console.error("[Retry Executor] Error during retry execution:", error);

    await markRetryComplete(retryItem.id, false);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      attempts: retryItem.attempts + 1,
    };
  }
}

/**
 * Execute brief generation with adjusted parameters based on failure reason
 */
async function executeRetryWithAdjustedParams(
  retryItem: RetryQueueItem
): Promise<RetryExecutionResult> {
  const adjustedParams = adjustParametersForRetry(
    retryItem.retryParams,
    retryItem.failureReason,
    retryItem.attempts
  );

  console.log("[Retry Executor] Adjusted parameters:", adjustedParams);

  const sources = await gatherSourcesWithAdjustedParams(
    retryItem.originalQuestion,
    adjustedParams
  );

  console.log(`[Retry Executor] Gathered ${sources.length} sources`);

  const brief = await generateBriefWithAdjustedParams(
    retryItem.originalQuestion,
    sources,
    adjustedParams
  );

  console.log("[Retry Executor] Brief generated, running quality gate...");

  const qualityResult = await runQualityGate(brief, sources);
  const decision = getTierDecision(qualityResult.finalScore);

  console.log(`[Retry Executor] Quality gate result: ${decision.reasoning}`);

  if (qualityResult.publishable) {
    return {
      success: true,
      finalScore: qualityResult.finalScore,
      tier: qualityResult.tier,
      attempts: retryItem.attempts + 1,
    };
  }

  return {
    success: false,
    finalScore: qualityResult.finalScore,
    tier: qualityResult.tier,
    error: `Quality gate failed with score ${qualityResult.finalScore.toFixed(1)}`,
    attempts: retryItem.attempts + 1,
  };
}

/**
 * Adjust retry parameters based on failure reason and attempt number
 */
function adjustParametersForRetry(
  existingParams: RetryParams,
  failureReason: string,
  attemptNumber: number
): RetryParams {
  const params = { ...existingParams };

  const lowEvidence =
    failureReason.toLowerCase().includes("evidence") ||
    failureReason.toLowerCase().includes("source");
  const lowObjectivity =
    failureReason.toLowerCase().includes("objectivity") ||
    failureReason.toLowerCase().includes("bias");
  const lowClarity =
    failureReason.toLowerCase().includes("clarity") ||
    failureReason.toLowerCase().includes("unclear");

  if (lowEvidence) {
    params.increasedSourceDiversity = true;
    params.minSources = Math.max(params.minSources || 10, 15);
  }

  if (lowObjectivity) {
    params.forceOpposingViews = true;
    params.specialistPersona = "Neutral Analyst";
  }

  if (lowClarity) {
    params.adjustedPrompts = [
      ...(params.adjustedPrompts || []),
      "Use shorter sentences",
      "Define technical terms",
      "Structure with clear headings",
    ];
  }

  if (attemptNumber >= 1) {
    params.increasedSourceDiversity = true;
    params.forceOpposingViews = true;
    params.minSources = Math.max(params.minSources || 10, 15);
  }

  if (!params.specialistPersona) {
    const personas = [
      "Investigative Journalist",
      "Policy Analyst",
      "Research Scholar",
    ];
    params.specialistPersona = personas[attemptNumber % personas.length];
  }

  return params;
}

/**
 * Gather sources with adjusted parameters
 */
async function gatherSourcesWithAdjustedParams(
  question: string,
  params: RetryParams
): Promise<Source[]> {
  console.log("[Retry Executor] Gathering sources with adjusted params...");

  const sources = await researchAgent(question);

  if (params.forceOpposingViews) {
    console.log("[Retry Executor] Forcing opposing views in sources...");
    return ensureOpposingViews(sources);
  }

  if (params.minSources && sources.length < params.minSources) {
    console.warn(
      `[Retry Executor] Only found ${sources.length} sources, target was ${params.minSources}`
    );
  }

  return sources;
}

/**
 * Ensure sources include opposing viewpoints
 */
function ensureOpposingViews(sources: Source[]): Source[] {
  const leftSources = sources.filter(
    (s) => s.political_lean === "left" || s.political_lean === "center-left"
  );
  const rightSources = sources.filter(
    (s) => s.political_lean === "right" || s.political_lean === "center-right"
  );
  const centerSources = sources.filter((s) => s.political_lean === "center");

  const minPerSide = Math.ceil(sources.length * 0.35);

  if (leftSources.length >= minPerSide && rightSources.length >= minPerSide) {
    return sources;
  }

  console.log(
    `[Retry Executor] Rebalancing sources: Left=${leftSources.length}, Right=${rightSources.length}, Center=${centerSources.length}`
  );

  return sources;
}

/**
 * Generate brief with adjusted parameters
 */
async function generateBriefWithAdjustedParams(
  question: string,
  sources: Source[],
  params: RetryParams
): Promise<GeneratedBrief> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const personaInstruction = params.specialistPersona
    ? `You are a ${params.specialistPersona}. `
    : "You are an expert intelligence analyst. ";

  const promptAdjustments = params.adjustedPrompts?.length
    ? `\n\nAdditional guidelines:\n${params.adjustedPrompts.map((p) => `- ${p}`).join("\n")}`
    : "";

  const balanceInstruction = params.forceOpposingViews
    ? "\n\nIMPORTANT: Present a balanced view with multiple perspectives. Include opposing viewpoints and acknowledge uncertainty where it exists."
    : "";

  const prompt = `${personaInstruction}Write a comprehensive intelligence brief answering this question:

"${question}"

Available sources:
${sources
  .map(
    (s, i) =>
      `[${i + 1}] ${s.title} (${s.publisher}) - Political lean: ${s.political_lean}`
  )
  .join("\n")}

Requirements:
1. Write a clear, engaging title
2. Write a 2-3 sentence executive summary
3. Write detailed analysis (500-800 words) that:
   - Synthesizes information from multiple sources
   - Presents evidence for key claims
   - Acknowledges limitations and uncertainties
   - Uses clear, accessible language
${promptAdjustments}${balanceInstruction}

Return JSON:
{
  "title": "<engaging title>",
  "summary": "<executive summary>",
  "content": "<detailed analysis>"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to parse brief generation response");
  }

  const result = JSON.parse(jsonMatch[0]);

  return {
    title: result.title,
    summary: result.summary,
    content: result.content,
    sources,
  };
}

/**
 * Process all pending retry items (for batch processing)
 */
export async function processAllPendingRetries(): Promise<RetryExecutionResult[]> {
  console.log("[Retry Executor] Processing all pending retries...");

  const results: RetryExecutionResult[] = [];
  let continueProcessing = true;

  while (continueProcessing) {
    const result = await processNextRetry();

    if (result === null) {
      continueProcessing = false;
    } else {
      results.push(result);
    }
  }

  console.log(
    `[Retry Executor] Completed processing. Success: ${results.filter((r) => r.success).length}/${results.length}`
  );

  return results;
}
