/**
 * Database Type Definitions
 *
 * Shared types for Supabase database schema
 */

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
          preferred_reading_level: string;
          topic_interests: string[] | null;
          location: string | null;
          notification_email_digest: boolean;
          notification_new_features: boolean;
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
          preferred_reading_level?: string;
          topic_interests?: string[] | null;
          location?: string | null;
          notification_email_digest?: boolean;
          notification_new_features?: boolean;
        };
        Update: {
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          preferred_reading_level?: string;
          topic_interests?: string[] | null;
          location?: string | null;
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
      saved_briefs: {
        Row: {
          id: string;
          user_id: string;
          brief_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          brief_id: string;
        };
      };
      reading_history: {
        Row: {
          id: string;
          user_id: string;
          brief_id: string;
          last_viewed_at: string;
          scroll_depth: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          brief_id: string;
          scroll_depth?: number | null;
        };
        Update: {
          last_viewed_at?: string;
          scroll_depth?: number | null;
        };
      };
    };
  };
}
