import { NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/client";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: briefs } = await supabase
      .from("briefs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: savedBriefs } = await supabase
      .from("saved_briefs")
      .select("brief_id, saved_at, briefs(id, question, clarity_score)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    const { data: readingHistory } = await supabase
      .from("reading_history")
      .select("brief_id, time_spent, scroll_depth, first_viewed_at, last_viewed_at, briefs(id, question)")
      .eq("user_id", user.id)
      .order("last_viewed_at", { ascending: false });

    const { data: feedback } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: briefJobs } = await supabase
      .from("brief_jobs")
      .select("id, question, status, created_at, completed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
      },
      profile: profile || null,
      briefsCreated: briefs || [],
      savedBriefs: savedBriefs || [],
      readingHistory: readingHistory || [],
      feedback: feedback || [],
      briefJobs: briefJobs || [],
    };

    const filename = `state-of-clarity-export-${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
