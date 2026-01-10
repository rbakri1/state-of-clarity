import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";

interface VoteResponse {
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<VoteResponse | { error: string }>> {
  const { id: briefId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: votes, error } = await supabase
    .from("brief_votes")
    .select("vote_type, user_id")
    .eq("brief_id", briefId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type VoteRow = { vote_type: "up" | "down"; user_id: string };
  const voteList = (votes ?? []) as VoteRow[];
  const upvotes = voteList.filter((v) => v.vote_type === "up").length;
  const downvotes = voteList.filter((v) => v.vote_type === "down").length;
  const userVote = user
    ? (voteList.find((v) => v.user_id === user.id)?.vote_type ?? null)
    : null;

  return NextResponse.json({ upvotes, downvotes, userVote });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  const { id: briefId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { vote_type: "up" | "down" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.vote_type || !["up", "down"].includes(body.vote_type)) {
    return NextResponse.json(
      { error: "vote_type must be 'up' or 'down'" },
      { status: 400 }
    );
  }

  const { data: existingVotes } = await supabase
    .from("brief_votes")
    .select("id")
    .eq("brief_id", briefId)
    .eq("user_id", user.id)
    .limit(1);

  const existingVote = existingVotes?.[0] as { id: string } | undefined;

  if (existingVote) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("brief_votes")
      .update({ vote_type: body.vote_type })
      .eq("id", existingVote.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("brief_votes")
      .insert({
        brief_id: briefId,
        user_id: user.id,
        vote_type: body.vote_type,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  const { id: briefId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("brief_votes")
    .delete()
    .eq("brief_id", briefId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
