import { createServiceRoleClient, type Database } from "../supabase/client";
import { withCache } from "../cache/with-cache";
import { invalidateCache } from "../cache/invalidate";

export type Brief = Database["public"]["Tables"]["briefs"]["Row"];
export type BriefInsert = Database["public"]["Tables"]["briefs"]["Insert"];
export type BriefUpdate = Database["public"]["Tables"]["briefs"]["Update"];

const BRIEF_CACHE_TTL = 300; // 5 minutes
const POPULAR_BRIEFS_CACHE_TTL = 600; // 10 minutes

export async function getBriefById(id: string): Promise<Brief | null> {
  return withCache<Brief | null>(
    `brief:${id}`,
    async () => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("briefs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        // PGRST116: No rows found
        // 22P02: Invalid UUID format
        if (error.code === "PGRST116" || error.code === "22P02") {
          return null;
        }
        throw error;
      }

      return data;
    },
    BRIEF_CACHE_TTL
  );
}

export async function updateBriefFromState(
  id: string,
  state: BriefUpdate
): Promise<Brief | null> {
  const supabase = createServiceRoleClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("briefs") as any)
    .update(state)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  await invalidateCache(`brief:${id}`);
  await invalidateCache("briefs:popular");

  return data as Brief;
}

export async function updateBriefClassification(
  id: string,
  clarityScore: number | null
): Promise<Brief | null> {
  const supabase = createServiceRoleClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("briefs") as any)
    .update({ clarity_score: clarityScore })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  await invalidateCache(`brief:${id}`);
  await invalidateCache("briefs:popular");

  return data as Brief;
}

export async function getPopularBriefs(limit: number = 10): Promise<Brief[]> {
  return withCache<Brief[]>(
    "briefs:popular",
    async () => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("briefs")
        .select("*")
        .order("clarity_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data ?? [];
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
 * Create a new brief and warm the cache.
 * Call this after brief generation completes.
 */
export async function createBrief(
  briefData: BriefInsert
): Promise<Brief | null> {
  const supabase = createServiceRoleClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("briefs") as any)
    .insert(briefData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const brief = data as Brief;

  // Warm the cache for the newly created brief
  await warmBriefCache(brief.id);

  // Also invalidate popular briefs cache since ranking may have changed
  await invalidateCache("briefs:popular");

  return brief;
}
