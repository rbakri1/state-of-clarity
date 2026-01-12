/**
 * Account Restore API Route
 *
 * Restores a soft-deleted account by clearing deleted_at and deletion_scheduled_at fields.
 * Called when a user clicks "Restore my account" on the deleted-account page.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("profiles").update({
    deleted_at: null,
    deletion_scheduled_at: null,
  }).eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to restore account" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Account restored successfully" });
}
