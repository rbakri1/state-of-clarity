/**
 * Explore Briefs API Route
 *
 * GET /api/briefs - Fetch briefs with filtering, sorting, and pagination
 *
 * Query params:
 * - q: Search term (matches question column)
 * - tags: Comma-separated tags to filter by
 * - minScore: Minimum clarity score (0-10)
 * - sort: newest | oldest | score | views
 * - date: week | month | year | all
 * - limit: Number of briefs to return (default 12)
 * - offset: Number of briefs to skip (default 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { exploreBriefsQuerySchema } from "@/lib/validation/brief-schemas";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const rawParams = {
      q: searchParams.get("q") ?? undefined,
      tags: searchParams.get("tags") ?? undefined,
      minScore: searchParams.get("minScore") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    };

    const validationResult = exploreBriefsQuerySchema.safeParse(rawParams);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { q, tags, minScore, sort, date, limit, offset } = validationResult.data;

    const supabase = getSupabaseClient();

    let query = (supabase.from("briefs") as any)
      .select("id, question, clarity_score, metadata, created_at, view_count, narrative, summaries", { count: "exact" })
      .eq("is_public", true);

    // Search filter (ilike on question)
    if (q && q.trim()) {
      query = query.ilike("question", `%${q.trim()}%`);
    }

    // Tags filter (overlaps with metadata->tags array)
    if (tags && tags.trim()) {
      const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        // Use OR conditions to match any of the selected tags
        // PostgREST syntax: metadata->tags.cs.["TagName"] checks if array contains the tag
        const tagConditions = tagArray.map(tag => `metadata->tags.cs.["${tag}"]`).join(',');
        query = query.or(tagConditions);
      }
    }

    // Minimum score filter
    if (minScore !== undefined) {
      query = query.gte("clarity_score", minScore);
    }

    // Date filter
    if (date && date !== "all") {
      const now = new Date();
      let dateFrom: Date;

      switch (date) {
        case "week":
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(0);
      }

      query = query.gte("created_at", dateFrom.toISOString());
    }

    // Sorting
    switch (sort) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "score":
        query = query.order("clarity_score", { ascending: false, nullsFirst: false });
        break;
      case "views":
        query = query.order("view_count", { ascending: false, nullsFirst: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: briefs, count, error } = await query;

    if (error) {
      console.error("[API /api/briefs] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch briefs" },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const hasMore = offset + (briefs?.length ?? 0) < total;

    return NextResponse.json(
      {
        briefs: briefs ?? [],
        total,
        hasMore,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[API /api/briefs] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
