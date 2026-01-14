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
