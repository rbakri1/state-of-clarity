import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

export async function GET() {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profileResult, savedBriefsResult, readingHistoryResult, feedbackResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("saved_briefs")
      .select(`
        saved_at,
        briefs:brief_id (
          id,
          question,
          clarity_score,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase
      .from("reading_history")
      .select(`
        first_viewed_at,
        last_viewed_at,
        time_spent,
        scroll_depth,
        briefs:brief_id (
          id,
          question,
          clarity_score
        )
      `)
      .eq("user_id", user.id)
      .order("last_viewed_at", { ascending: false }),
    supabase
      .from("feedback")
      .select(`
        id,
        type,
        content,
        section,
        status,
        created_at,
        briefs:brief_id (
          id,
          question
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile: profileResult.data ?? null,
    saved_briefs: savedBriefsResult.data ?? [],
    reading_history: readingHistoryResult.data ?? [],
    feedback: feedbackResult.data ?? [],
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  return new NextResponse(jsonString, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="state-of-clarity-data-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
