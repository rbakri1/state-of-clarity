"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export interface ReadingHistoryEntry {
  brief_id: string;
  read_at: string;
  time_spent_seconds: number | null;
  reading_level_viewed: string | null;
  brief: {
    question: string;
    clarity_score: number | null;
    metadata: {
      tags?: string[];
    } | null;
  } | null;
}

export function useReadingHistory() {
  const [history, setHistory] = useState<ReadingHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient();

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHistory([]);
        return;
      }

      // Fetch reading history with brief details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from("reading_history")
        .select(
          `
          brief_id,
          read_at,
          time_spent_seconds,
          reading_level_viewed,
          brief:briefs (
            question,
            clarity_score,
            metadata
          )
        `
        )
        .eq("user_id", user.id)
        .order("read_at", { ascending: false });

      if (fetchError) {
        // Table may not exist yet - return empty array
        if (fetchError.code === "PGRST116" || fetchError.code === "42P01") {
          setHistory([]);
        } else {
          throw fetchError;
        }
      } else {
        setHistory(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch reading history"));
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, error, refetch: fetchHistory };
}
