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

// Reading level types
export type ReadingLevel = "simple" | "standard" | "advanced";

// Credit transaction types
export type CreditTransactionType = "purchase" | "usage" | "refund" | "expiry" | "bonus";

// Payment retry status
export type PaymentRetryStatus = "pending" | "retrying" | "succeeded" | "failed";

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
          location: string | null;
          preferred_reading_level: ReadingLevel | null;
          topic_interests: string[] | null;
          notification_email_digest: boolean;
          notification_new_features: boolean;
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
          location?: string | null;
          preferred_reading_level?: ReadingLevel | null;
          topic_interests?: string[] | null;
          notification_email_digest?: boolean;
          notification_new_features?: boolean;
          reputation_score?: number;
        };
        Update: {
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          preferred_reading_level?: ReadingLevel | null;
          topic_interests?: string[] | null;
          notification_email_digest?: boolean;
          notification_new_features?: boolean;
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
          metadata: any; // JSONB
          fork_of: string | null;
          quality_gate_metadata: Record<string, unknown> | null; // JSONB - US-012
        };
        Insert: {
          question: string;
          summaries: any;
          structured_data: any;
          narrative: string;
          user_id?: string | null;
          clarity_score?: number | null;
          metadata?: any;
          quality_gate_metadata?: Record<string, unknown> | null;
        };
        Update: {
          summaries?: any;
          structured_data?: any;
          narrative?: string;
          clarity_score?: number | null;
          quality_gate_metadata?: Record<string, unknown> | null;
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
      retry_queue: {
        Row: {
          id: string;
          brief_id: string | null;
          original_question: string;
          classification: Record<string, unknown> | null;
          failure_reason: string;
          retry_params: Record<string, unknown>;
          scheduled_at: string;
          attempts: number;
          status: "pending" | "processing" | "completed" | "abandoned";
          created_at: string;
        };
        Insert: {
          brief_id?: string | null;
          original_question: string;
          classification?: Record<string, unknown> | null;
          failure_reason: string;
          retry_params?: Record<string, unknown>;
          scheduled_at: string;
          attempts?: number;
          status?: "pending" | "processing" | "completed" | "abandoned";
        };
        Update: {
          retry_params?: Record<string, unknown>;
          scheduled_at?: string;
          attempts?: number;
          status?: "pending" | "processing" | "completed" | "abandoned";
        };
      };
      credit_refunds: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          brief_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          reason: string;
          brief_id?: string | null;
        };
        Update: {
          amount?: number;
          reason?: string;
        };
      };
      agent_execution_logs: {
        Row: {
          id: string;
          brief_id: string | null;
          execution_id: string;
          step_name: string;
          step_type: "research" | "generation" | "quality_gate" | "refinement" | "save" | "refund" | "retry_queue" | "error";
          status: "started" | "completed" | "failed";
          metadata: Record<string, unknown>;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          brief_id?: string | null;
          execution_id: string;
          step_name: string;
          step_type: "research" | "generation" | "quality_gate" | "refinement" | "save" | "refund" | "retry_queue" | "error";
          status: "started" | "completed" | "failed";
          metadata?: Record<string, unknown>;
          duration_ms?: number | null;
        };
        Update: {
          status?: "started" | "completed" | "failed";
          metadata?: Record<string, unknown>;
          duration_ms?: number | null;
        };
      };
      quality_gate_decisions: {
        Row: {
          id: string;
          brief_id: string | null;
          execution_id: string;
          question: string;
          initial_score: number | null;
          final_score: number;
          tier: "high" | "acceptable" | "failed";
          attempts: number;
          publishable: boolean;
          refund_triggered: boolean;
          retry_scheduled: boolean;
          evaluator_scores: Record<string, unknown> | null;
          refinement_history: Record<string, unknown> | null;
          decision_reasoning: string | null;
          created_at: string;
        };
        Insert: {
          brief_id?: string | null;
          execution_id: string;
          question: string;
          initial_score?: number | null;
          final_score: number;
          tier: "high" | "acceptable" | "failed";
          attempts?: number;
          publishable: boolean;
          refund_triggered?: boolean;
          retry_scheduled?: boolean;
          evaluator_scores?: Record<string, unknown> | null;
          refinement_history?: Record<string, unknown> | null;
          decision_reasoning?: string | null;
        };
        Update: {
          final_score?: number;
          tier?: "high" | "acceptable" | "failed";
          attempts?: number;
          publishable?: boolean;
          refund_triggered?: boolean;
          retry_scheduled?: boolean;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          transaction_type: "purchase" | "usage" | "refund" | "expiry" | "bonus";
          description: string | null;
          brief_id: string | null;
          stripe_payment_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          transaction_type: "purchase" | "usage" | "refund" | "expiry" | "bonus";
          description?: string | null;
          brief_id?: string | null;
          stripe_payment_id?: string | null;
        };
        Update: {
          description?: string | null;
        };
      };
      payment_retries: {
        Row: {
          id: string;
          user_id: string;
          stripe_payment_intent_id: string;
          attempts: number;
          last_attempt_at: string | null;
          next_retry_at: string | null;
          status: "pending" | "retrying" | "succeeded" | "failed";
          package_id: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          stripe_payment_intent_id: string;
          attempts?: number;
          last_attempt_at?: string | null;
          next_retry_at?: string | null;
          status?: "pending" | "retrying" | "succeeded" | "failed";
          package_id?: string | null;
          error_message?: string | null;
        };
        Update: {
          attempts?: number;
          last_attempt_at?: string | null;
          next_retry_at?: string | null;
          status?: "pending" | "retrying" | "succeeded" | "failed";
          error_message?: string | null;
        };
      };
      credit_packages: {
        Row: {
          id: string;
          name: string;
          credits: number;
          price_gbp: number;
          stripe_price_id: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          credits: number;
          price_gbp: number;
          stripe_price_id?: string | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          credits?: number;
          price_gbp?: number;
          stripe_price_id?: string | null;
          active?: boolean;
        };
      };
      user_credits: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
        };
        Update: {
          balance?: number;
        };
      };
      credit_batches: {
        Row: {
          id: string;
          user_id: string;
          credits_remaining: number;
          purchased_at: string;
          expires_at: string;
        };
        Insert: {
          user_id: string;
          credits_remaining: number;
          expires_at: string;
        };
        Update: {
          credits_remaining?: number;
          expires_at?: string;
        };
      };
      saved_briefs: {
        Row: {
          user_id: string;
          brief_id: string;
          saved_at: string;
        };
        Insert: {
          user_id: string;
          brief_id: string;
        };
        Update: {};
      };
      reading_history: {
        Row: {
          user_id: string;
          brief_id: string;
          time_spent: number | null;
          scroll_depth: number | null;
          first_viewed_at: string;
          last_viewed_at: string;
        };
        Insert: {
          user_id: string;
          brief_id: string;
          time_spent?: number | null;
          scroll_depth?: number | null;
        };
        Update: {
          time_spent?: number | null;
          scroll_depth?: number | null;
          last_viewed_at?: string;
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
 * Uses singleton pattern to reuse client across requests.
 */
let serviceRoleClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export function createServiceRoleClient() {
  if (!serviceRoleClientInstance) {
    serviceRoleClientInstance = createClient<Database>(
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
  return serviceRoleClientInstance;
}

/**
 * Execute a database query with retry logic for connection errors.
 * Retries up to 3 times with exponential backoff.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const isConnectionError = 
        lastError.message.includes("fetch failed") ||
        lastError.message.includes("network") ||
        lastError.message.includes("ECONNREFUSED") ||
        lastError.message.includes("ETIMEDOUT") ||
        lastError.message.includes("socket hang up");
      
      if (!isConnectionError || attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.log(`[Supabase] Connection error, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
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
