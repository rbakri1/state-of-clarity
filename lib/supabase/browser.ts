/**
 * Browser-only Supabase Client
 * 
 * Use this in client components (with "use client" directive).
 * This file is separate from client.ts to avoid importing server-only modules.
 */

import { createClient } from "@supabase/supabase-js";

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
