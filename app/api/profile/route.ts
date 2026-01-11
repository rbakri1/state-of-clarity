import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/errors/with-error-handling";
import { ApiError } from "@/lib/errors/api-error";

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

export const GET = withErrorHandling(async () => {
  const supabase = createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw ApiError.unauthorized();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    throw ApiError.serviceUnavailable("Failed to fetch profile");
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
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const supabase = createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw ApiError.unauthorized();
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    throw ApiError.validationError("Invalid JSON body");
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
    throw ApiError.validationError("No valid fields to update");
  }

  if ("username" in updateData) {
    const username = updateData.username;

    if (username !== null && typeof username === "string") {
      if (!USERNAME_REGEX.test(username)) {
        throw ApiError.validationError(
          "Username must be 3-20 characters and contain only letters, numbers, and underscores",
          { field: "username" }
        );
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw ApiError.serviceUnavailable("Failed to check username availability");
      }

      if (existingUser) {
        throw ApiError.validationError("Username is already taken", { field: "username" });
      }
    }
  }

  if ("bio" in updateData && typeof updateData.bio === "string") {
    if (updateData.bio.length > 280) {
      throw ApiError.validationError("Bio must be 280 characters or less", { field: "bio" });
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
        throw ApiError.serviceUnavailable("Failed to create profile");
      }

      return NextResponse.json({ profile: newProfile });
    }

    throw ApiError.serviceUnavailable("Failed to update profile");
  }

  return NextResponse.json({ profile: updatedProfile });
});
