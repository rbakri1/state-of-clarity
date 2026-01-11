import { createServiceRoleClient, type Database } from "../supabase/client";
import { withCache } from "../cache/with-cache";

export type Brief = Database["public"]["Tables"]["briefs"]["Row"];

const BRIEF_CACHE_TTL = 300; // 5 minutes

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
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    },
    BRIEF_CACHE_TTL
  );
}
