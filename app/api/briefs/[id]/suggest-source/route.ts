import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { screenFeedback, ScreeningResult } from "@/lib/services/feedback-screening";

interface SuggestSourceRequest {
  url: string;
  title?: string;
  publisher?: string;
  political_lean?: string;
  notes?: string;
}

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean; id: string } | { error: string }>> {
  const { id: briefId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SuggestSourceRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  if (!isValidUrl(body.url)) {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("source_suggestions")
    .insert({
      brief_id: briefId,
      user_id: user.id,
      url: body.url,
      title: body.title || null,
      publisher: body.publisher || null,
      political_lean: body.political_lean || null,
      notes: body.notes || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const suggestionId = data.id;

  (async () => {
    try {
      const screeningResult: ScreeningResult = await screenFeedback("source_suggestion", {
        url: body.url,
        notes: body.notes,
      });

      let newStatus = "pending";
      if (screeningResult.flagged) {
        newStatus = "flagged";
      } else if (screeningResult.approved && screeningResult.confidence > 0.9) {
        newStatus = "approved";
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("source_suggestions")
        .update({
          ai_screening_result: screeningResult,
          status: newStatus,
        })
        .eq("id", suggestionId);
    } catch (e) {
      console.error("Failed to screen source suggestion:", e);
    }
  })();

  return NextResponse.json({ success: true, id: suggestionId });
}
