import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { screenFeedback, ScreeningResult } from "@/lib/services/feedback-screening";

const ERROR_TYPES = ["factual", "outdated", "misleading", "other"] as const;
type ErrorType = (typeof ERROR_TYPES)[number];

interface ReportErrorRequest {
  error_type: ErrorType;
  description: string;
  location_hint?: string;
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

  let body: ReportErrorRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.error_type) {
    return NextResponse.json({ error: "Error type is required" }, { status: 400 });
  }

  if (!ERROR_TYPES.includes(body.error_type)) {
    return NextResponse.json(
      { error: `Invalid error type. Must be one of: ${ERROR_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!body.description) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  if (body.description.length < 20) {
    return NextResponse.json(
      { error: "Description must be at least 20 characters" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("error_reports")
    .insert({
      brief_id: briefId,
      user_id: user.id,
      error_type: body.error_type,
      description: body.description,
      location_hint: body.location_hint || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reportId = data.id;

  (async () => {
    try {
      const screeningResult: ScreeningResult = await screenFeedback("error_report", {
        error_type: body.error_type,
        description: body.description,
      });

      let newStatus = "pending";
      if (screeningResult.flagged) {
        newStatus = "flagged";
      } else if (screeningResult.approved && screeningResult.confidence > 0.9) {
        newStatus = "approved";
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("error_reports")
        .update({
          ai_screening_result: screeningResult,
          status: newStatus,
        })
        .eq("id", reportId);
    } catch (e) {
      console.error("Failed to screen error report:", e);
    }
  })();

  return NextResponse.json({ success: true, id: reportId });
}
