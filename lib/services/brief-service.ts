/**
 * Brief Service
 *
 * Provides functions for creating, updating, and retrieving briefs.
 * Handles saving classification data and other brief metadata to the database.
 */

import { createClient } from "@supabase/supabase-js";
import type { QuestionClassification } from "../types/classification";
import type { BriefState, StructureOutput, NarrativeOutput, SummaryOutputs, ClarityScore } from "../agents/langgraph-orchestrator";
import type { Source } from "../agents/research-agent";

export interface BriefRecord {
  id: string;
  question: string;
  version: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  summaries: SummaryOutputs;
  structured_data: StructureOutput;
  narrative: string;
  posit: any | null;
  historical_summary: any | null;
  foundational_principles: any | null;
  clarity_score: number | null;
  clarity_critique: ClarityScore | null;
  classification: QuestionClassification | null;
  metadata: {
    tags: string[];
    generation_time_ms?: number;
    agent_count?: number;
  };
  fork_of: string | null;
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Create a new brief record in the database
 */
export async function createBrief(
  question: string,
  userId?: string | null
): Promise<{ id: string; error: Error | null }> {
  const supabase = getSupabaseClient();

  const { data, error } = await (supabase.from("briefs") as any).insert({
    question,
    user_id: userId || null,
    summaries: {},
    structured_data: { factors: [], policies: [], timeline: [] },
    narrative: "",
    metadata: { tags: [] },
  }).select("id").single();

  if (error) {
    console.error("[BriefService] Error creating brief:", error);
    return { id: "", error: new Error(error.message) };
  }

  console.log(`[BriefService] Created brief with ID: ${data.id}`);
  return { id: data.id, error: null };
}

/**
 * Update a brief with classification data
 */
export async function updateBriefClassification(
  briefId: string,
  classification: QuestionClassification
): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();

  console.log(`[BriefService] Saving classification for brief ${briefId}:`, classification);

  const { error } = await (supabase.from("briefs") as any)
    .update({ classification })
    .eq("id", briefId);

  if (error) {
    console.error("[BriefService] Error updating classification:", error);
    return { error: new Error(error.message) };
  }

  console.log(`[BriefService] Classification saved successfully for brief ${briefId}`);
  return { error: null };
}

/**
 * Update a brief with the full generated content from the pipeline
 */
export async function updateBriefFromState(
  briefId: string,
  state: BriefState
): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();

  const updateData: Record<string, any> = {};

  if (state.classification) {
    updateData.classification = state.classification;
  }

  if (state.structure) {
    updateData.structured_data = state.structure;
  }

  if (state.narrative) {
    updateData.narrative = JSON.stringify(state.narrative);
  }

  if (state.summaries && Object.keys(state.summaries).length > 0) {
    updateData.summaries = state.summaries;
  }

  if (state.clarityScore) {
    updateData.clarity_score = state.clarityScore.overall;
    updateData.clarity_critique = state.clarityScore;
  }

  if (state.consensusResult) {
    updateData.clarity_score = state.consensusResult.clarityScore.overallScore;
  }

  if (state.scoringMetadata) {
    updateData.scoring_metadata = state.scoringMetadata;
  }

  if (state.needsHumanReview !== undefined) {
    updateData.needs_human_review = state.needsHumanReview;
  }

  if (state.reviewReason) {
    updateData.review_reason = state.reviewReason;
  }

  if (Object.keys(updateData).length === 0) {
    return { error: null };
  }

  console.log(`[BriefService] Updating brief ${briefId} with fields:`, Object.keys(updateData));

  const { error } = await (supabase.from("briefs") as any)
    .update(updateData)
    .eq("id", briefId);

  if (error) {
    console.error("[BriefService] Error updating brief:", error);
    return { error: new Error(error.message) };
  }

  console.log(`[BriefService] Brief ${briefId} updated successfully`);
  return { error: null };
}

/**
 * Save sources associated with a brief
 */
export async function saveBriefSources(
  briefId: string,
  sources: Source[]
): Promise<{ error: Error | null }> {
  if (!sources || sources.length === 0) {
    return { error: null };
  }

  const supabase = getSupabaseClient();

  const sourceRecords = sources.map((source) => ({
    brief_id: briefId,
    url: source.url,
    title: source.title,
    author: source.author || null,
    publisher: source.publisher || null,
    publication_date: source.publication_date || null,
    source_type: source.source_type || null,
    political_lean: source.political_lean || null,
    credibility_score: source.credibility_score || null,
    excerpt: source.content?.slice(0, 500) || null,
    full_content: source.content || null,
  }));

  const { error } = await (supabase.from("sources") as any).insert(sourceRecords);

  if (error) {
    console.error("[BriefService] Error saving sources:", error);
    return { error: new Error(error.message) };
  }

  console.log(`[BriefService] Saved ${sources.length} sources for brief ${briefId}`);
  return { error: null };
}

/**
 * Get a brief by ID
 */
export async function getBriefById(briefId: string): Promise<{ data: BriefRecord | null; error: Error | null }> {
  const supabase = getSupabaseClient();

  const { data, error } = await (supabase.from("briefs") as any)
    .select("*")
    .eq("id", briefId)
    .single();

  if (error) {
    console.error("[BriefService] Error fetching brief:", error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as BriefRecord, error: null };
}

/**
 * Complete a brief generation job by saving all state to the database
 * This is the main function to call after the pipeline completes
 */
export async function completeBriefGeneration(
  briefId: string,
  state: BriefState,
  generationTimeMs?: number
): Promise<{ error: Error | null }> {
  console.log(`[BriefService] Completing brief generation for ${briefId}`);

  // Update brief with all generated content
  const { error: updateError } = await updateBriefFromState(briefId, state);
  if (updateError) {
    return { error: updateError };
  }

  // Save sources
  if (state.sources && state.sources.length > 0) {
    const { error: sourcesError } = await saveBriefSources(briefId, state.sources);
    if (sourcesError) {
      console.error("[BriefService] Warning: Failed to save sources:", sourcesError);
    }
  }

  // Update metadata with generation time if provided
  if (generationTimeMs) {
    const supabase = getSupabaseClient();
    await (supabase.from("briefs") as any)
      .update({
        metadata: {
          tags: generateTagsFromClassification(state.classification),
          generation_time_ms: generationTimeMs,
          agent_count: 6,
        },
      })
      .eq("id", briefId);
  }

  console.log(`[BriefService] Brief generation completed for ${briefId}`);
  return { error: null };
}

/**
 * Generate tags from classification data
 */
function generateTagsFromClassification(classification: QuestionClassification | null): string[] {
  if (!classification) {
    return [];
  }

  const tags: string[] = [];

  // Add domain as a tag
  const domainLabels: Record<string, string> = {
    economics: "Economics",
    healthcare: "Healthcare",
    climate: "Climate",
    education: "Education",
    defense: "Defense",
    immigration: "Immigration",
    housing: "Housing",
    justice: "Justice",
    technology: "Technology",
    governance: "Governance",
    other: "General",
  };
  tags.push(domainLabels[classification.domain] || classification.domain);

  // Add controversy level for high controversy topics
  if (classification.controversyLevel === "high") {
    tags.push("Contentious");
  }

  // Add temporal scope if not timeless
  if (classification.temporalScope === "historical") {
    tags.push("Historical");
  } else if (classification.temporalScope === "future") {
    tags.push("Future-looking");
  }

  // Add question type for analytical or opinion pieces
  if (classification.questionType === "analytical") {
    tags.push("Analysis");
  } else if (classification.questionType === "comparative") {
    tags.push("Comparison");
  }

  return tags;
}
