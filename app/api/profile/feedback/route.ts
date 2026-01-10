import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  // Fetch all feedback types for this user in parallel
  const [votesResult, sourcesResult, errorsResult, editsResult] =
    await Promise.all([
      supabase
        .from("brief_votes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("source_suggestions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("error_reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("edit_proposals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  return NextResponse.json({
    votes: votesResult.data || [],
    source_suggestions: sourcesResult.data || [],
    error_reports: errorsResult.data || [],
    edit_proposals: editsResult.data || [],
  });
}
