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
