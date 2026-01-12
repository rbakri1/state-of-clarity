/**
 * Brief Save/Unsave API Route
 *
 * POST: Save a brief to user's collection
 * DELETE: Remove a brief from user's collection
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getSupabaseClient() {
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseClient();
  const { id: briefId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if already saved
  const { data: existing } = await (supabase as any)
    .from("saved_briefs")
    .select("id")
    .eq("user_id", user.id)
    .eq("brief_id", briefId)
    .single();

  if (existing) {
    return NextResponse.json({ saved: true, message: "Brief already saved" });
  }

  // Insert new saved brief
  const { data, error } = await (supabase as any)
    .from("saved_briefs")
    .insert({ user_id: user.id, brief_id: briefId })
    .select()
    .single();

  if (error) {
    console.error("Error saving brief:", error);
    return NextResponse.json({ error: "Failed to save brief" }, { status: 500 });
  }

  return NextResponse.json({ saved: true, id: data.id });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseClient();
  const { id: briefId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await (supabase as any)
    .from("saved_briefs")
    .delete()
    .eq("user_id", user.id)
    .eq("brief_id", briefId);

  if (error) {
    console.error("Error unsaving brief:", error);
    return NextResponse.json({ error: "Failed to unsave brief" }, { status: 500 });
  }

  return NextResponse.json({ saved: false });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseClient();
  const { id: briefId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ saved: false, authenticated: false });
  }

  const { data: existing } = await (supabase as any)
    .from("saved_briefs")
    .select("id")
    .eq("user_id", user.id)
    .eq("brief_id", briefId)
    .single();

  return NextResponse.json({ saved: !!existing, authenticated: true });
}
