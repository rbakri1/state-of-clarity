/**
 * Browser-only Supabase Client
 * Use in client components ("use client" directive)
 * This file doesn't import next/headers so it's safe for client components
 */

import { createClient } from "@supabase/supabase-js";

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
          summaries: any;
          structured_data: any;
          narrative: string;
          posit: any | null;
          historical_summary: any | null;
          foundational_principles: any | null;
          clarity_score: number | null;
          clarity_critique: any | null;
          metadata: any;
          fork_of: string | null;
        };
        Insert: {
          question: string;
          summaries: any;
          structured_data: any;
          narrative: string;
          user_id?: string | null;
          clarity_score?: number | null;
          metadata?: any;
        };
        Update: {
          summaries?: any;
          structured_data?: any;
          narrative?: string;
          clarity_score?: number | null;
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
      question_templates: {
        Row: {
          id: string;
          category: string;
          question_text: string;
          is_featured: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          category: string;
          question_text: string;
          is_featured?: boolean;
          display_order?: number;
        };
        Update: {
          category?: string;
          question_text?: string;
          is_featured?: boolean;
          display_order?: number;
        };
      };
    };
  };
}

/**
 * Browser Client - Use in client components (use client directive)
 */
export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
