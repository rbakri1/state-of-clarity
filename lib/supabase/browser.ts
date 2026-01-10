/**
 * Supabase Browser Client
 * Use in client components (use client directive)
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
