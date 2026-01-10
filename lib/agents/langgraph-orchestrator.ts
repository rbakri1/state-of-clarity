/**
 * LangGraph Orchestrator
 *
 * Main entry point for brief generation pipeline.
 * Integrates quality gate as the final step after brief generation.
 *
 * Pipeline flow:
 * 1. Research Agent - Gather diverse sources
 * 2. Brief Generation - Create structured content
 * 3. Quality Gate - Score and decide on publishing
 * 4. Final Actions - Save, refund, or queue for retry
 */

import Anthropic from "@anthropic-ai/sdk";
import { researchAgent, type Source } from "./research-agent";
import { runQualityGate, getTierDecision } from "./quality-gate";
import { addToRetryQueue, generateRetryParams } from "../services/retry-queue-service";
import { refundCredits } from "../services/credit-service";
import { createServiceRoleClient, type Database } from "../supabase/client";
import { QualityTier, type QualityGateResult } from "../types/quality-gate";
import {
  createExecutionContext,
  logPipelineStep,
  logQualityGateDecision,
  type ExecutionContext,
} from "../services/quality-gate-metrics";

type BriefInsert = Database["public"]["Tables"]["briefs"]["Insert"];

interface BriefContent {
  title: string;
  summary: string;
  content: string;
  sources: Source[];
}

interface GenerationResult {
  success: boolean;
  briefId?: string;
  qualityResult?: QualityGateResult;
  error?: string;
  refundTriggered?: boolean;
  retryScheduled?: boolean;
}

interface QuestionClassification {
  topic: string;
  category: string;
  complexity: string;
  [key: string]: unknown;
}

/**
 * Main orchestrator - generates a brief with quality gate integration
 */
export async function generateBriefWithQualityGate(
  question: string,
  userId?: string | null,
  classification?: QuestionClassification
): Promise<GenerationResult> {
  const execContext = createExecutionContext();
  console.log("[Orchestrator] Starting brief generation pipeline");
  console.log(`[Orchestrator] Execution ID: ${execContext.executionId}`);
  console.log(`[Orchestrator] Question: "${question}"`);

  try {
    // Step 1: Research - Gather sources
    console.log("[Orchestrator] Step 1: Gathering sources via Research Agent");
    const sources = await researchAgent(question);
    await logPipelineStep(execContext, {
      name: "Gather sources via Research Agent",
      type: "research",
      status: "completed",
      metadata: { sourceCount: sources.length },
    });

    // Step 2: Generate brief content
    console.log("[Orchestrator] Step 2: Generating brief content");
    const briefContent = await generateBriefContent(question, sources);
    await logPipelineStep(execContext, {
      name: "Generate brief content",
      type: "generation",
      status: "completed",
      metadata: { title: briefContent.title },
    });

    // Step 3: Quality Gate - Score and decide
    console.log("[Orchestrator] Step 3: Running Quality Gate");
    const qualityResult = await runQualityGate(briefContent, sources);
    const decision = getTierDecision(qualityResult.finalScore);
    await logPipelineStep(execContext, {
      name: "Run Quality Gate",
      type: "quality_gate",
      status: "completed",
      metadata: {
        score: qualityResult.finalScore,
        tier: qualityResult.tier,
        attempts: qualityResult.attempts,
        publishable: qualityResult.publishable,
      },
    });

    // Step 4: Final Actions based on quality tier
    if (qualityResult.publishable) {
      // Save brief to database
      console.log("[Orchestrator] Step 4: Saving brief to database");
      const briefId = await saveBrief(
        question,
        briefContent,
        sources,
        qualityResult,
        userId
      );

      // Update context with brief ID for logging
      execContext.briefId = briefId;

      await logPipelineStep(execContext, {
        name: "Save brief to database",
        type: "save",
        status: "completed",
        metadata: { briefId, qualityWarning: qualityResult.warningBadge },
      });

      // Log quality gate decision
      await logQualityGateDecision(execContext, question, qualityResult, {
        decisionReasoning: decision.reasoning,
        refundTriggered: false,
        retryScheduled: false,
      });

      console.log(
        `[Orchestrator] Pipeline complete. Brief ${briefId} published with score ${qualityResult.finalScore.toFixed(1)}/10`
      );

      return {
        success: true,
        briefId,
        qualityResult,
      };
    } else {
      // Failed quality gate - refund and queue for retry
      console.log("[Orchestrator] Step 4: Brief failed quality gate");

      // Trigger refund if user exists
      let refundTriggered = false;
      if (userId) {
        await refundCredits(userId, 1, `Quality gate failure: ${decision.reasoning}`);
        refundTriggered = true;
        await logPipelineStep(execContext, {
          name: "Refund credits",
          type: "refund",
          status: "completed",
          metadata: { userId, amount: 1 },
        });
      }

      // Add to retry queue
      const retryParams = generateRetryParams(decision.reasoning);
      await addToRetryQueue(
        null, // No brief ID since we didn't save
        question,
        (classification as Record<string, unknown>) || {},
        decision.reasoning,
        retryParams
      );

      await logPipelineStep(execContext, {
        name: "Add to retry queue",
        type: "retry_queue",
        status: "completed",
        metadata: { failureReason: decision.reasoning, retryParams },
      });

      // Log quality gate decision
      await logQualityGateDecision(execContext, question, qualityResult, {
        decisionReasoning: decision.reasoning,
        refundTriggered,
        retryScheduled: true,
      });

      console.log(
        `[Orchestrator] Pipeline complete. Brief failed with score ${qualityResult.finalScore.toFixed(1)}/10. Queued for retry.`
      );

      return {
        success: false,
        qualityResult,
        error: decision.reasoning,
        refundTriggered,
        retryScheduled: true,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Orchestrator] Pipeline failed:", errorMessage);

    await logPipelineStep(execContext, {
      name: "Pipeline error",
      type: "error",
      status: "failed",
      metadata: { error: errorMessage },
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate brief content using Claude
 */
async function generateBriefContent(
  question: string,
  sources: Source[]
): Promise<BriefContent> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const sourcesSummary = sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title} (${s.publisher}, ${s.political_lean}, credibility: ${s.credibility_score.toFixed(1)}/10)\n${s.content.slice(0, 500)}...`
    )
    .join("\n\n");

  const prompt = `You are a senior policy analyst creating an objective, evidence-rich intelligence brief.

Question: ${question}

Sources (${sources.length} total):
${sourcesSummary}

Create a comprehensive brief with:
1. A clear, informative title
2. A 2-3 sentence executive summary
3. A detailed narrative (800-1200 words) that:
   - Presents multiple perspectives objectively
   - Cites sources inline using [1], [2], etc.
   - Addresses key arguments from different political viewpoints
   - Includes relevant statistics and evidence
   - Maintains neutral, analytical tone

Return JSON:
{
  "title": "<compelling title>",
  "summary": "<executive summary>",
  "content": "<full narrative with inline citations>"
}`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to parse brief content from Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    title: parsed.title,
    summary: parsed.summary,
    content: parsed.content,
    sources,
  };
}

/**
 * Save brief to database with quality metadata
 */
async function saveBrief(
  question: string,
  briefContent: BriefContent,
  sources: Source[],
  qualityResult: QualityGateResult,
  userId?: string | null
): Promise<string> {
  const supabase = createServiceRoleClient();

  const briefData: BriefInsert = {
    question,
    narrative: briefContent.content,
    summaries: {
      executive: briefContent.summary,
    },
    structured_data: {
      title: briefContent.title,
      sourceCount: sources.length,
      politicalBalance: calculatePoliticalBalance(sources),
    },
    clarity_score: qualityResult.finalScore,
    metadata: {
      quality_warning: qualityResult.warningBadge,
      quality_tier: qualityResult.tier,
      quality_attempts: qualityResult.attempts,
      generated_at: new Date().toISOString(),
    },
    user_id: userId || null,
  };

  const { data, error } = await supabase
    .from("briefs")
    .insert(briefData as never)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to save brief: ${error.message}`);
  }

  const briefId = (data as { id: string }).id;

  // Save sources to sources table and create brief_sources links
  await saveSourcesAndLinks(supabase, briefId, sources);

  return briefId;
}

/**
 * Save sources and create brief-source links
 */
async function saveSourcesAndLinks(
  supabase: ReturnType<typeof createServiceRoleClient>,
  briefId: string,
  sources: Source[]
): Promise<void> {
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];

    // Upsert source (might already exist from previous briefs)
    const { data: sourceData, error: sourceError } = await supabase
      .from("sources")
      .upsert(
        {
          url: source.url,
          title: source.title,
          publisher: source.publisher,
          source_type: source.source_type,
          political_lean: source.political_lean,
          credibility_score: source.credibility_score,
          excerpt: source.content.slice(0, 500),
          publication_date: source.publication_date,
        } as never,
        { onConflict: "url" }
      )
      .select("id")
      .single();

    if (sourceError) {
      console.warn(`[Orchestrator] Failed to save source ${source.url}:`, sourceError.message);
      continue;
    }

    const sourceId = (sourceData as { id: string }).id;

    // Create brief-source link
    await supabase.from("brief_sources").insert({
      brief_id: briefId,
      source_id: sourceId,
      display_order: i + 1,
    } as never);
  }
}

/**
 * Calculate political balance metrics
 */
function calculatePoliticalBalance(sources: Source[]): Record<string, number> {
  const counts: Record<string, number> = {
    left: 0,
    "center-left": 0,
    center: 0,
    "center-right": 0,
    right: 0,
    unknown: 0,
  };

  sources.forEach((s) => {
    counts[s.political_lean] = (counts[s.political_lean] || 0) + 1;
  });

  const total = sources.length;
  const percentages: Record<string, number> = {};
  Object.keys(counts).forEach((lean) => {
    percentages[lean] = Math.round((counts[lean] / total) * 100);
  });

  return percentages;
}

/**
 * Export types for external use
 */
export type { GenerationResult, BriefContent, QuestionClassification };
