/**
 * Brief Service
 *
 * Provides functions for creating, updating, and retrieving briefs.
 * Handles saving classification data and other brief metadata to the database.
 * Includes caching with automatic cache warming and invalidation.
 */

import { createClient } from "@supabase/supabase-js";
import type { QuestionClassification } from "../types/classification";
import type { BriefState, StructureOutput, NarrativeOutput, SummaryOutputs, ClarityScore } from "../agents/langgraph-orchestrator";
import type { Source } from "../agents/research-agent";
import { safeQuery, type SafeQueryResult } from "../supabase/safe-query";
import { withCache } from "../cache/with-cache";
import { invalidateCache } from "../cache/invalidate";

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
  view_count: number;
}

const BRIEF_CACHE_TTL = 300; // 5 minutes
const POPULAR_BRIEFS_CACHE_TTL = 600; // 10 minutes

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
    structured_data: {
      definitions: [],
      factors: [],
      policies: [],
      consequences: [],
      timeline: []
    },
    narrative: "",
    metadata: { tags: [] },
  }).select("id").single();

  if (error) {
    console.error("[BriefService] Error creating brief:", error);
    return { id: "", error: new Error(error.message) };
  }

  console.log(`[BriefService] Created brief with ID: ${data.id}`);

  // Warm the cache for the newly created brief
  await warmBriefCache(data.id);

  return { id: data.id, error: null };
}

/**
 * Update a brief with classification data
 * Note: classification column doesn't exist in DB yet - this is a no-op
 * TODO: Add classification column to briefs table in Supabase
 */
export async function updateBriefClassification(
  briefId: string,
  classification: QuestionClassification
): Promise<{ error: Error | null }> {
  // Skip - classification column doesn't exist in DB yet
  console.log(`[BriefService] Skipping classification save (column not in DB) for brief ${briefId}`);
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

  // Note: classification column doesn't exist in DB yet - store in metadata instead
  // if (state.classification) {
  //   updateData.classification = state.classification;
  // }

  if (state.structure) {
    updateData.structured_data = state.structure;
  }

  if (state.narrative) {
    // Convert NarrativeOutput object to plain text with double newlines
    const narrativeParts = [
      state.narrative.introduction,
      state.narrative.mainBody,
      state.narrative.conclusion
    ].filter(part => part && part.trim().length > 0);

    updateData.narrative = narrativeParts.join("\n\n");
  }

  if (state.summaries && Object.keys(state.summaries).length > 0) {
    console.log(`[BriefService] 📊 Summaries to save:`, Object.keys(state.summaries));
    console.log(`[BriefService] Summary lengths:`, Object.fromEntries(
      Object.entries(state.summaries).map(([k, v]) => [k, v?.length || 0])
    ));
    updateData.summaries = state.summaries;
  } else {
    console.warn(`[BriefService] ⚠️  NO SUMMARIES to save! state.summaries:`, state.summaries);
  }

  if (state.clarityScore) {
    updateData.clarity_score = state.clarityScore.overall;
    updateData.clarity_critique = state.clarityScore;
  }

  if (Object.keys(updateData).length === 0) {
    console.log(`[BriefService] ⚠️  No updates to make for brief ${briefId}`);
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

  // Invalidate caches after update
  await invalidateCache(`brief:${briefId}`);
  await invalidateCache("briefs:popular");

  console.log(`[BriefService] Brief ${briefId} updated successfully`);
  return { error: null };
}

/**
 * Save sources associated with a brief
 * Uses the sources table + brief_sources junction table
 */
export async function saveBriefSources(
  briefId: string,
  sources: Source[]
): Promise<{ error: Error | null }> {
  if (!sources || sources.length === 0) {
    return { error: null };
  }

  const supabase = getSupabaseClient();

  try {
    // Step 1: Upsert sources into the sources table (using URL as unique key)
    const sourceRecords = sources.map((source) => ({
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

    // Upsert sources (insert or update if URL already exists)
    const { data: upsertedSources, error: sourcesError } = await (supabase
      .from("sources") as any)
      .upsert(sourceRecords, { onConflict: "url" })
      .select("id, url");

    if (sourcesError) {
      console.error("[BriefService] Error upserting sources:", sourcesError);
      return { error: new Error(sourcesError.message) };
    }

    // Step 2: Create a map of URL -> source_id for the junction table
    const urlToIdMap = new Map<string, string>();
    for (const source of upsertedSources || []) {
      urlToIdMap.set(source.url, source.id);
    }

    // Step 3: Insert relationships into brief_sources junction table
    const junctionRecords = sources.map((source, index) => ({
      brief_id: briefId,
      source_id: urlToIdMap.get(source.url),
      display_order: index + 1,
      usage_note: null,
    })).filter(record => record.source_id); // Only include records where we have a source_id

    if (junctionRecords.length > 0) {
      const { error: junctionError } = await (supabase
        .from("brief_sources") as any)
        .insert(junctionRecords);

      if (junctionError) {
        console.error("[BriefService] Error linking sources to brief:", junctionError);
        return { error: new Error(junctionError.message) };
      }
    }

    console.log(`[BriefService] Saved ${sources.length} sources for brief ${briefId}`);
    return { error: null };
  } catch (err) {
    console.error("[BriefService] Unexpected error saving sources:", err);
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Get a brief by ID with caching and safe error handling
 * Cache key format: brief:{id}
 * TTL: 300 seconds (5 minutes)
 * Includes sources via the brief_sources junction table
 */
export async function getBriefById(briefId: string): Promise<SafeQueryResult<BriefRecord>> {
  const cacheKey = `brief:${briefId}`;

  return withCache<SafeQueryResult<BriefRecord>>(
    cacheKey,
    async () => {
      const supabase = getSupabaseClient();

      // Fetch brief with sources via junction table
      const result = await safeQuery<any>(
        () => (supabase.from("briefs") as any)
          .select(`
            *,
            brief_sources(
              display_order,
              sources(*)
            )
          `)
          .eq("id", briefId)
          .single(),
        {
          queryName: "getBriefById",
          table: "briefs",
          briefId,
        }
      );

      // Transform the data structure to flatten sources
      if (result.data && result.data.brief_sources) {
        const sources = result.data.brief_sources
          .map((bs: any) => bs.sources)
          .filter((s: any) => s !== null)
          .sort((a: any, b: any) => {
            const orderA = result.data.brief_sources.find((bs: any) => bs.sources?.id === a.id)?.display_order || 0;
            const orderB = result.data.brief_sources.find((bs: any) => bs.sources?.id === b.id)?.display_order || 0;
            return orderA - orderB;
          });

        result.data.sources = sources;
        delete result.data.brief_sources;
      }

      return result as SafeQueryResult<BriefRecord>;
    },
    BRIEF_CACHE_TTL
  );
}

/**
 * Get popular briefs with caching
 */
export async function getPopularBriefs(limit: number = 10): Promise<SafeQueryResult<BriefRecord[]>> {
  return withCache<SafeQueryResult<BriefRecord[]>>(
    "briefs:popular",
    async () => {
      const supabase = getSupabaseClient();
      return safeQuery<BriefRecord[]>(
        () => (supabase.from("briefs") as any)
          .select("*")
          .order("clarity_score", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(limit),
        {
          queryName: "getPopularBriefs",
          table: "briefs",
        }
      );
    },
    POPULAR_BRIEFS_CACHE_TTL
  );
}

/**
 * Warm the cache for a specific brief after creation or update.
 * This ensures the brief is immediately available from cache.
 */
export async function warmBriefCache(briefId: string): Promise<void> {
  console.log(`[Cache Warming] Warming cache for brief:${briefId}`);
  try {
    await getBriefById(briefId);
    console.log(`[Cache Warming] Successfully warmed cache for brief:${briefId}`);
  } catch (error) {
    console.error(`[Cache Warming] Failed to warm cache for brief:${briefId}:`, error);
  }
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
  console.log(`[BriefService] 🎬 Completing brief generation for ${briefId}`);
  console.log(`[BriefService] State has summaries: ${!!state.summaries}`);
  console.log(`[BriefService] Summaries keys: ${Object.keys(state.summaries || {}).join(', ') || 'NONE'}`);
  console.log(`[BriefService] Generation time: ${generationTimeMs}ms`);

  // Update brief with all generated content
  const { error: updateError } = await updateBriefFromState(briefId, state);
  if (updateError) {
    console.error(`[BriefService] ❌ Failed to update brief: ${updateError.message}`);
    return { error: updateError };
  }
  console.log(`[BriefService] ✅ Successfully updated brief ${briefId}`);

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

  // Warm cache after generation completes
  await warmBriefCache(briefId);

  // Invalidate popular briefs since rankings may have changed
  await invalidateCache("briefs:popular");

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
