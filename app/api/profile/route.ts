import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/errors/with-error-handling";
import { ApiError } from "@/lib/errors/api-error";
import { safeQuery } from "@/lib/supabase/safe-query";

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

  const profileResult = await safeQuery(
    () => supabase.from("profiles").select("*").eq("id", user.id).single(),
    { queryName: "getProfile", table: "profiles", userId: user.id }
  );

  if (profileResult.isConnectionError) {
    throw ApiError.serviceUnavailable("Database temporarily unavailable");
  }

  const [briefsResult, savedResult, feedbackResult] = await Promise.all([
    safeQuery(
      () => supabase.from("briefs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      { queryName: "countBriefs", table: "briefs", userId: user.id }
    ),
    safeQuery(
      () => supabase.from("saved_briefs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      { queryName: "countSavedBriefs", table: "saved_briefs", userId: user.id }
    ),
    safeQuery(
      () => supabase.from("feedback").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      { queryName: "countFeedback", table: "feedback", userId: user.id }
    ),
  ]);

  const stats = {
    briefs_generated: (briefsResult.data as { count: number } | null)?.count ?? 0,
    briefs_saved: (savedResult.data as { count: number } | null)?.count ?? 0,
    feedback_count: (feedbackResult.data as { count: number } | null)?.count ?? 0,
  };
  const profile = profileResult.data;

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

      const usernameCheck = await safeQuery(
        () => supabase.from("profiles").select("id").eq("username", username).neq("id", user.id).single(),
        { queryName: "checkUsername", table: "profiles", userId: user.id }
      );

      if (usernameCheck.isConnectionError) {
        throw ApiError.serviceUnavailable("Database temporarily unavailable");
      }

      if (usernameCheck.data) {
        throw ApiError.validationError("Username is already taken", { field: "username" });
      }
    }
  }

  if ("bio" in updateData && typeof updateData.bio === "string") {
    if (updateData.bio.length > 280) {
      throw ApiError.validationError("Bio must be 280 characters or less", { field: "bio" });
    }
  }

  const updateResult = await safeQuery(
    () => supabase.from("profiles").update(updateData).eq("id", user.id).select().single(),
    { queryName: "updateProfile", table: "profiles", userId: user.id }
  );

  if (updateResult.isConnectionError) {
    throw ApiError.serviceUnavailable("Database temporarily unavailable");
  }

  if (updateResult.error && !updateResult.data) {
    const insertResult = await safeQuery(
      () => supabase.from("profiles").insert({ id: user.id, ...updateData }).select().single(),
      { queryName: "insertProfile", table: "profiles", userId: user.id }
    );

    if (insertResult.isConnectionError || insertResult.error) {
      throw ApiError.serviceUnavailable("Database temporarily unavailable");
    }

    return NextResponse.json({ profile: insertResult.data });
  }

  return NextResponse.json({ profile: updateResult.data });
});
