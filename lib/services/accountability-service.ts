/**
 * Accountability Service
 *
 * Provides CRUD functions for accountability investigations.
 * Handles creating, updating, and retrieving investigations and their sources.
 */

import { createClient } from "@supabase/supabase-js";
import type {
  EntityType,
  AccountabilityInvestigation,
  AccountabilityInvestigationSource,
  UpdateInvestigationInput,
  UKProfileData,
  CorruptionScenario,
} from "../types/accountability";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Create a new accountability investigation record in the database.
 *
 * @param targetEntity - The name of the entity being investigated
 * @param userId - The ID of the user creating the investigation
 * @param entityType - Whether the target is an individual or organization
 * @param ethicsAcknowledgedAt - When the user acknowledged the ethics agreement
 * @returns The ID of the newly created investigation
 */
export async function createInvestigation(
  targetEntity: string,
  userId: string,
  entityType: EntityType,
  ethicsAcknowledgedAt: Date
): Promise<{ id: string }> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await (supabase.from("accountability_investigations") as any)
      .insert({
        target_entity: targetEntity,
        user_id: userId,
        entity_type: entityType,
        ethics_acknowledged_at: ethicsAcknowledgedAt.toISOString(),
        profile_data: {},
        corruption_scenarios: [],
        action_items: [],
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create investigation: ${error.message}`);
    }

    console.log(`[AccountabilityService] Created investigation with ID: ${data.id}`);
    return { id: data.id };
  } catch (err) {
    console.error("[AccountabilityService] Error creating investigation:", err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Fetch an accountability investigation by its ID.
 *
 * @param investigationId - The UUID of the investigation to fetch
 * @returns The investigation record if found, or null if not found
 */
export async function getInvestigation(
  investigationId: string
): Promise<AccountabilityInvestigation | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await (supabase.from("accountability_investigations") as any)
    .select("*")
    .eq("id", investigationId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[AccountabilityService] Error fetching investigation:", error);
    return null;
  }

  return data as AccountabilityInvestigation;
}

/**
 * Update an investigation with results after AI generation completes.
 *
 * @param investigationId - The UUID of the investigation to update
 * @param data - Partial update object with optional fields:
 *   - profileData: The generated UK profile data
 *   - corruptionScenarios: Array of corruption scenarios
 *   - actionItems: Array of action items
 *   - qualityScore: Quality score (0-10)
 *   - qualityNotes: Array of quality notes
 *   - generationTimeMs: Time taken to generate results
 *   - dataSourcesCount: Number of data sources used
 */
export async function updateInvestigationResults(
  investigationId: string,
  data: UpdateInvestigationInput
): Promise<void> {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {};

  if (data.profile_data !== undefined) {
    updateData.profile_data = data.profile_data;
  }
  if (data.corruption_scenarios !== undefined) {
    updateData.corruption_scenarios = data.corruption_scenarios;
  }
  if (data.action_items !== undefined) {
    updateData.action_items = data.action_items;
  }
  if (data.quality_score !== undefined) {
    updateData.quality_score = data.quality_score;
  }
  if (data.quality_notes !== undefined) {
    updateData.quality_notes = data.quality_notes;
  }
  if (data.generation_time_ms !== undefined) {
    updateData.generation_time_ms = data.generation_time_ms;
  }
  if (data.data_sources_count !== undefined) {
    updateData.data_sources_count = data.data_sources_count;
  }

  try {
    const { error } = await (supabase.from("accountability_investigations") as any)
      .update(updateData)
      .eq("id", investigationId);

    if (error) {
      throw new Error(`Failed to update investigation results: ${error.message}`);
    }

    console.log(`[AccountabilityService] Updated investigation ${investigationId} with results`);
  } catch (err) {
    console.error("[AccountabilityService] Error updating investigation results:", err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * List all investigations for a given user.
 *
 * @param userId - The UUID of the user whose investigations to fetch
 * @param limit - Maximum number of investigations to return (default: 50)
 * @returns Array of investigations ordered by created_at DESC (newest first), empty array if none found
 */
export async function listUserInvestigations(
  userId: string,
  limit: number = 50
): Promise<AccountabilityInvestigation[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await (supabase.from("accountability_investigations") as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[AccountabilityService] Error listing user investigations:", error);
    return [];
  }

  return (data || []) as AccountabilityInvestigation[];
}

/**
 * Add a source record to an investigation.
 *
 * @param investigationId - The UUID of the investigation to add the source to
 * @param source - The source data to add (excludes id, investigation_id, created_at which are auto-generated)
 * @returns The ID of the newly created source record
 */
export async function addInvestigationSource(
  investigationId: string,
  source: Omit<AccountabilityInvestigationSource, "id" | "investigation_id" | "created_at">
): Promise<{ id: string }> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await (supabase.from("accountability_investigation_sources") as any)
      .insert({
        investigation_id: investigationId,
        source_type: source.source_type,
        url: source.url,
        title: source.title,
        accessed_at: source.accessed_at,
        data_extracted: source.data_extracted,
        verification_status: source.verification_status,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to add investigation source: ${error.message}`);
    }

    console.log(`[AccountabilityService] Added source to investigation ${investigationId}`);
    return { id: data.id };
  } catch (err) {
    console.error("[AccountabilityService] Error adding investigation source:", err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Get all sources for an investigation.
 *
 * @param investigationId - The UUID of the investigation to get sources for
 * @returns Array of sources ordered by accessed_at DESC (most recent first)
 */
export async function getInvestigationSources(
  investigationId: string
): Promise<AccountabilityInvestigationSource[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await (supabase.from("accountability_investigation_sources") as any)
    .select("*")
    .eq("investigation_id", investigationId)
    .order("accessed_at", { ascending: false });

  if (error) {
    console.error("[AccountabilityService] Error fetching investigation sources:", error);
    return [];
  }

  return (data || []) as AccountabilityInvestigationSource[];
}

/**
 * Calculate a quality score for an investigation based on data completeness.
 *
 * Scoring Rubric (Total: 0-10 points):
 * - Sources score (0-5 points):
 *   - 0-3 sources: 0 points
 *   - 4-6 sources: 2.5 points
 *   - 7+ sources: 5 points
 * - Scenarios score (0-5 points):
 *   - <3 scenarios: 0 points
 *   - 3-5 scenarios: 2.5 points
 *   - 6+ scenarios: 5 points
 *
 * @param investigation - Object containing profile_data, corruption_scenarios, and data_sources_count
 * @returns Object with score (0-10, rounded to 1 decimal) and notes explaining the breakdown
 */
export function calculateQualityScore(investigation: {
  profile_data: UKProfileData;
  corruption_scenarios: CorruptionScenario[];
  data_sources_count: number;
}): { score: number; notes: string[] } {
  const notes: string[] = [];
  
  const sourcesCount = investigation.data_sources_count ?? 0;
  const scenariosCount = investigation.corruption_scenarios?.length ?? 0;

  let sourcesScore: number;
  if (sourcesCount >= 7) {
    sourcesScore = 5;
    notes.push(`Sources: ${sourcesCount} sources (7+) = 5.0 points`);
  } else if (sourcesCount >= 4) {
    sourcesScore = 2.5;
    notes.push(`Sources: ${sourcesCount} sources (4-6) = 2.5 points`);
  } else {
    sourcesScore = 0;
    notes.push(`Sources: ${sourcesCount} sources (0-3) = 0 points`);
  }

  let scenariosScore: number;
  if (scenariosCount >= 6) {
    scenariosScore = 5;
    notes.push(`Scenarios: ${scenariosCount} scenarios (6+) = 5.0 points`);
  } else if (scenariosCount >= 3) {
    scenariosScore = 2.5;
    notes.push(`Scenarios: ${scenariosCount} scenarios (3-5) = 2.5 points`);
  } else {
    scenariosScore = 0;
    notes.push(`Scenarios: ${scenariosCount} scenarios (<3) = 0 points`);
  }

  const totalScore = Math.round((sourcesScore + scenariosScore) * 10) / 10;
  
  notes.push(`Total score: ${totalScore}/10`);

  if (totalScore < 6.0) {
    notes.push("QUALITY GATE FAILED");
  } else {
    notes.push("Quality gate passed");
  }

  return { score: totalScore, notes };
}
