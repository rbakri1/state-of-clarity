/**
 * Supabase Client Configuration
 *
 * Two clients:
 * 1. Browser client (for client components)
 * 2. Server client (for API routes and server components)
 */

import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Type definitions for database schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          reputation_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          reputation_score?: number;
        };
        Update: {
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
        };
      };
      briefs: {
        Row: {
          id: string;
          question: string;
          version: number;
          user_id: string | null;
          created_at: string;
          updated_at: string;
          summaries: any; // JSONB
          structured_data: any; // JSONB
          narrative: string;
          posit: any | null; // JSONB
          historical_summary: any | null; // JSONB
          foundational_principles: any | null; // JSONB
          clarity_score: number | null;
          clarity_critique: any | null; // JSONB
          classification: any | null; // JSONB - QuestionClassification
          metadata: any; // JSONB
          fork_of: string | null;
        };
        Insert: {
          question: string;
          summaries: any;
          structured_data: any;
          narrative: string;
          user_id?: string | null;
          clarity_score?: number | null;
          classification?: any | null;
          metadata?: any;
        };
        Update: {
          summaries?: any;
          structured_data?: any;
          narrative?: string;
          clarity_score?: number | null;
          classification?: any | null;
        };
      };
      sources: {
        Row: {
          id: string;
          url: string;
          title: string;
          author: string | null;
          publisher: string | null;
          publication_date: string | null;
          source_type: "primary" | "secondary" | "tertiary" | null;
          political_lean:
            | "left"
            | "center-left"
            | "center"
            | "center-right"
            | "right"
            | "unknown"
            | null;
          credibility_score: number | null;
          excerpt: string | null;
          full_content: string | null;
          accessed_at: string;
          created_at: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          brief_id: string;
          user_id: string | null;
          type:
            | "upvote"
            | "downvote"
            | "suggest_source"
            | "spot_error"
            | "edit_proposal";
          content: string | null;
          section: string | null;
          status: "pending" | "reviewed" | "accepted" | "rejected";
          reviewer_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          brief_id: string;
          user_id?: string | null;
          type:
            | "upvote"
            | "downvote"
            | "suggest_source"
            | "spot_error"
            | "edit_proposal";
          content?: string | null;
          section?: string | null;
        };
      };
      brief_jobs: {
        Row: {
          id: string;
          question: string;
          user_id: string | null;
          status:
            | "pending"
            | "researching"
            | "structuring"
            | "writing"
            | "scoring"
            | "completed"
            | "failed";
          current_stage: string | null;
          progress: number;
          brief_id: string | null;
          error_message: string | null;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
          api_cost_gbp: number | null;
        };
        Insert: {
          question: string;
          user_id?: string | null;
        };
        Update: {
          status?:
            | "pending"
            | "researching"
            | "structuring"
            | "writing"
            | "scoring"
            | "completed"
            | "failed";
          current_stage?: string | null;
          progress?: number;
          brief_id?: string | null;
          error_message?: string | null;
        };
      };
    };
  };
}

/**
 * Browser Client
 * Use in client components (use client directive)
 */
export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Server Client (for API routes and server components)
 * Handles cookie-based authentication
 */
export async function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie errors (e.g., in middleware)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  );
}

/**
 * Service Role Client (for admin operations, bypasses RLS)
 * NEVER expose to client! Only use in server-side code.
 */
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Helper to get current user from server components
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Helper to require authentication (throw if not logged in)
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
