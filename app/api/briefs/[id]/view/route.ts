/**
 * Brief View Tracking API Route
 *
 * POST /api/briefs/[id]/view - Increments view count for a brief
 * Only increments once per session (tracked via cookie)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Brief ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const viewedCookieName = `brief_viewed_${id}`;
    const alreadyViewed = cookieStore.get(viewedCookieName);

    if (alreadyViewed) {
      return NextResponse.json({
        success: true,
        incremented: false,
        message: "Already viewed in this session",
      });
    }

    const supabase = getSupabaseClient();

    const { data: currentBrief, error: fetchError } = await (supabase.from("briefs") as any)
      .select("view_count")
      .eq("id", id)
      .single();

    if (fetchError || !currentBrief) {
      console.error("[View Tracking] Brief not found:", id);
      return NextResponse.json(
        { success: false, error: "Brief not found" },
        { status: 404 }
      );
    }

    const newCount = (currentBrief.view_count || 0) + 1;
    const { error: updateError } = await (supabase.from("briefs") as any)
      .update({ view_count: newCount })
      .eq("id", id);

    if (updateError) {
      console.error("[View Tracking] Failed to increment view count:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to increment view count" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      incremented: true,
      viewCount: newCount,
    });

    response.cookies.set(viewedCookieName, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("[View Tracking] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
