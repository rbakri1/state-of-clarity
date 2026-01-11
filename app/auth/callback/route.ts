/**
 * Auth Callback Route
 *
 * Handles OAuth and magic link callbacks from Supabase Auth.
 * This route exchanges the auth code for a session and creates/updates
 * the user profile on first login.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        const displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User";

        const avatarUrl =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;

        await supabase.from("profiles").insert({
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          preferred_reading_level: "undergrad",
          topics_of_interest: [],
          notification_preferences: { email: true, push: false },
          anonymous_posting: false,
        });
      }
    }
  }

  if (type === "recovery") {
    return NextResponse.redirect(new URL("/settings/password", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
