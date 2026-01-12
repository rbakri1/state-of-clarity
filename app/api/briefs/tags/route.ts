/**
 * Tags API Route
 *
 * GET /api/briefs/tags - Fetch all unique tags with counts from public briefs
 *
 * Returns array of { tag: string, count: number } sorted by count descending
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface TagWithCount {
  tag: string;
  count: number;
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Fetch only the metadata from public briefs
    const { data: briefs, error } = await supabase
      .from("briefs")
      .select("metadata")
      .eq("is_public", true);

    if (error) {
      console.error("[API /api/briefs/tags] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tags" },
        { status: 500 }
      );
    }

    // Count tags from all public briefs
    const tagCounts = new Map<string, number>();
    
    (briefs || []).forEach((brief) => {
      const tags = brief.metadata?.tags || [];
      if (Array.isArray(tags)) {
        tags.forEach((tag: string) => {
          if (typeof tag === "string" && tag.trim()) {
            tagCounts.set(tag.trim(), (tagCounts.get(tag.trim()) || 0) + 1);
          }
        });
      }
    });

    // Convert to array and sort by count descending
    const tagsWithCounts: TagWithCount[] = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(
      { tags: tagsWithCounts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("[API /api/briefs/tags] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
