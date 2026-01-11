import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { screenFeedback, ScreeningResult } from "@/lib/services/feedback-screening";

const SECTIONS = ["summary", "narrative", "structured_data"] as const;
type Section = (typeof SECTIONS)[number];

interface ProposeEditRequest {
  section: Section;
  original_text: string;
  proposed_text: string;
  rationale: string;
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

  let body: ProposeEditRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.section) {
    return NextResponse.json({ error: "Section is required" }, { status: 400 });
  }

  if (!SECTIONS.includes(body.section)) {
    return NextResponse.json(
      { error: `Invalid section. Must be one of: ${SECTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!body.original_text) {
    return NextResponse.json({ error: "Original text is required" }, { status: 400 });
  }

  if (body.original_text.length < 20) {
    return NextResponse.json(
      { error: "Original text must be at least 20 characters" },
      { status: 400 }
    );
  }

  if (!body.proposed_text) {
    return NextResponse.json({ error: "Proposed text is required" }, { status: 400 });
  }

  if (body.proposed_text.length < 20) {
    return NextResponse.json(
      { error: "Proposed text must be at least 20 characters" },
      { status: 400 }
    );
  }

  if (!body.rationale) {
    return NextResponse.json({ error: "Rationale is required" }, { status: 400 });
  }

  if (body.rationale.length < 20) {
    return NextResponse.json(
      { error: "Rationale must be at least 20 characters" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("edit_proposals")
    .insert({
      brief_id: briefId,
      user_id: user.id,
      section: body.section,
      original_text: body.original_text,
      proposed_text: body.proposed_text,
      rationale: body.rationale,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const proposalId = data.id;

  (async () => {
    try {
      const screeningResult: ScreeningResult = await screenFeedback("edit_proposal", {
        original_text: body.original_text,
        proposed_text: body.proposed_text,
        rationale: body.rationale,
      });

      let newStatus = "pending";
      if (screeningResult.flagged) {
        newStatus = "flagged";
      } else if (screeningResult.approved && screeningResult.confidence > 0.9) {
        newStatus = "approved";
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("edit_proposals")
        .update({
          ai_screening_result: screeningResult,
          status: newStatus,
        })
        .eq("id", proposalId);
    } catch (e) {
      console.error("Failed to screen edit proposal:", e);
    }
  })();

  return NextResponse.json({ success: true, id: proposalId });
}
