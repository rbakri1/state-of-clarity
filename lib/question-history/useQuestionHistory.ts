"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export interface QuestionHistoryEntry {
  id: string;
  question: string;
  asked_at: string;
  brief_id: string | null;
}

export function useQuestionHistory() {
  const [questions, setQuestions] = useState<QuestionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient();

  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setQuestions([]);
        return;
      }

      // Fetch question history - this uses brief_jobs table to track asked questions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from("brief_jobs")
        .select("id, question, created_at, brief_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        // Table may not exist yet - return empty array
        if (fetchError.code === "PGRST116" || fetchError.code === "42P01") {
          setQuestions([]);
        } else {
          throw fetchError;
        }
      } else {
        // Map to expected interface
        const mapped: QuestionHistoryEntry[] = (data || []).map((item: { id: string; question: string; created_at: string; brief_id: string | null }) => ({
          id: item.id,
          question: item.question,
          asked_at: item.created_at,
          brief_id: item.brief_id,
        }));
        setQuestions(mapped);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch question history"));
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return { questions, isLoading, error, refetch: fetchQuestions };
}
