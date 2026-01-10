import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["admin@stateofclarity.com"];

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email) || email.endsWith("@stateofclarity.com");
}

const VALID_TYPES = ["source_suggestion", "error_report", "edit_proposal"] as const;
const VALID_STATUSES = ["pending", "approved", "rejected", "flagged"] as const;

type FeedbackType = (typeof VALID_TYPES)[number];
type FeedbackStatus = (typeof VALID_STATUSES)[number];

const TYPE_TO_TABLE: Record<FeedbackType, string> = {
  source_suggestion: "source_suggestions",
  error_report: "error_reports",
  edit_proposal: "edit_proposals",
};

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, id, status } = body as {
    type?: string;
    id?: string;
    status?: string;
  };

  if (!type || !VALID_TYPES.includes(type as FeedbackType)) {
    return NextResponse.json(
      { error: "Invalid type. Must be one of: source_suggestion, error_report, edit_proposal" },
      { status: 400 }
    );
  }

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!status || !VALID_STATUSES.includes(status as FeedbackStatus)) {
    return NextResponse.json(
      { error: "Invalid status. Must be one of: pending, approved, rejected, flagged" },
      { status: 400 }
    );
  }

  const tableName = TYPE_TO_TABLE[type as FeedbackType];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from(tableName)
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update feedback status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id, status });
}

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items: Array<{
    id: string;
    type: string;
    brief_id: string;
    brief_title: string;
    user_email: string;
    status: string;
    created_at: string;
    ai_screening_result: unknown;
    content: Record<string, unknown>;
  }> = [];

  const { data: sourceSuggestions } = await (supabase as any)
    .from("source_suggestions")
    .select("id, brief_id, user_id, url, title, publisher, political_lean, notes, status, ai_screening_result, created_at")
    .order("created_at", { ascending: false });

  const { data: errorReports } = await (supabase as any)
    .from("error_reports")
    .select("id, brief_id, user_id, error_type, description, location_hint, status, ai_screening_result, created_at")
    .order("created_at", { ascending: false });

  const { data: editProposals } = await (supabase as any)
    .from("edit_proposals")
    .select("id, brief_id, user_id, section, original_text, proposed_text, rationale, status, ai_screening_result, created_at")
    .order("created_at", { ascending: false });

  const userIds = new Set<string>();
  const briefIds = new Set<string>();

  for (const item of sourceSuggestions || []) {
    userIds.add(item.user_id);
    briefIds.add(item.brief_id);
  }
  for (const item of errorReports || []) {
    userIds.add(item.user_id);
    briefIds.add(item.brief_id);
  }
  for (const item of editProposals || []) {
    userIds.add(item.user_id);
    briefIds.add(item.brief_id);
  }

  const userEmails: Record<string, string> = {};
  if (userIds.size > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (supabase as any)
      .from("profiles")
      .select("id, username")
      .in("id", Array.from(userIds));

    for (const profile of profiles || []) {
      userEmails[profile.id] = profile.username || "Unknown User";
    }
  }

  const briefTitles: Record<string, string> = {};
  if (briefIds.size > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: briefs } = await (supabase as any)
      .from("briefs")
      .select("id, question")
      .in("id", Array.from(briefIds));

    for (const brief of briefs || []) {
      briefTitles[brief.id] = brief.question || "Unknown Brief";
    }
  }

  for (const item of sourceSuggestions || []) {
    items.push({
      id: item.id,
      type: "source_suggestion",
      brief_id: item.brief_id,
      brief_title: briefTitles[item.brief_id] || `Brief ${item.brief_id.slice(0, 8)}...`,
      user_email: userEmails[item.user_id] || "Unknown User",
      status: item.status,
      created_at: item.created_at,
      ai_screening_result: item.ai_screening_result,
      content: {
        url: item.url,
        title: item.title,
        publisher: item.publisher,
        political_lean: item.political_lean,
        notes: item.notes,
      },
    });
  }

  for (const item of errorReports || []) {
    items.push({
      id: item.id,
      type: "error_report",
      brief_id: item.brief_id,
      brief_title: briefTitles[item.brief_id] || `Brief ${item.brief_id.slice(0, 8)}...`,
      user_email: userEmails[item.user_id] || "Unknown User",
      status: item.status,
      created_at: item.created_at,
      ai_screening_result: item.ai_screening_result,
      content: {
        error_type: item.error_type,
        description: item.description,
        location_hint: item.location_hint,
      },
    });
  }

  for (const item of editProposals || []) {
    items.push({
      id: item.id,
      type: "edit_proposal",
      brief_id: item.brief_id,
      brief_title: briefTitles[item.brief_id] || `Brief ${item.brief_id.slice(0, 8)}...`,
      user_email: userEmails[item.user_id] || "Unknown User",
      status: item.status,
      created_at: item.created_at,
      ai_screening_result: item.ai_screening_result,
      content: {
        section: item.section,
        original_text: item.original_text,
        proposed_text: item.proposed_text,
        rationale: item.rationale,
      },
    });
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ items });
}
