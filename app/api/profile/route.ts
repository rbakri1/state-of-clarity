import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function createSupabaseClient() {
  const cookieStore = cookies();

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

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function GET() {
  const supabase = createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }

  const [briefsResult, savedResult, feedbackResult] = await Promise.all([
    supabase
      .from("briefs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("saved_briefs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const stats = {
    briefs_generated: briefsResult.count ?? 0,
    briefs_saved: savedResult.count ?? 0,
    feedback_count: feedbackResult.count ?? 0,
  };

  return NextResponse.json({
    profile: profile ?? null,
    stats,
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: user.user_metadata,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowedFields = [
    "full_name",
    "username",
    "bio",
    "location",
    "preferred_reading_level",
    "topic_interests",
    "notification_email_digest",
    "notification_new_features",
  ];
  const updateData: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  if ("username" in updateData) {
    const username = updateData.username;

    if (username !== null && typeof username === "string") {
      if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json(
          {
            error:
              "Username must be 3-20 characters and contain only letters, numbers, and underscores",
          },
          { status: 400 }
        );
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        return NextResponse.json(
          { error: "Failed to check username availability" },
          { status: 500 }
        );
      }

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }
  }

  if ("bio" in updateData && typeof updateData.bio === "string") {
    if (updateData.bio.length > 280) {
      return NextResponse.json(
        { error: "Bio must be 280 characters or less" },
        { status: 400 }
      );
    }
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (updateError) {
    if (updateError.code === "PGRST116") {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id, ...updateData })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }

      return NextResponse.json({ profile: newProfile });
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile: updatedProfile });
}
