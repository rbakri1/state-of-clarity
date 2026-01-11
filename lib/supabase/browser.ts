/**
 * Browser-specific Supabase client and types
 * This file should ONLY contain client-safe code (no next/headers imports)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Reading level types for profile preferences
export type ReadingLevel = "simple" | "standard" | "advanced";

// Notification preferences structure
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
}

// Simplified Database type for browser usage
// Full type is in client.ts, but we keep a minimal version here to avoid circular imports
interface Database {
  public: {
    Tables: Record<string, unknown>;
  };
}

/**
 * Browser Client
 * Use in client components (use client directive)
 */
export function createBrowserClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
