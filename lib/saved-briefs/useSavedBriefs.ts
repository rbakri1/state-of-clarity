"use client";

/**
 * Saved Briefs Hook
 *
 * Provides functionality to save and unsave briefs.
 * Used in the UserMenu and brief detail pages.
 */

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface SavedBrief {
  id: string;
  briefId: string;
  savedAt: string;
}

interface SavedBriefsState {
  savedBriefs: SavedBrief[];
  savedBriefIds: Set<string>;
  savedCount: number;
  isLoading: boolean;
  saveBrief: (briefId: string) => Promise<void>;
  unsaveBrief: (briefId: string) => Promise<void>;
  isSaved: (briefId: string) => boolean;
}

export function useSavedBriefs(): SavedBriefsState {
  const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const savedBriefIds = new Set(savedBriefs.map((b) => b.briefId));

  useEffect(() => {
    const supabase = createBrowserClient();

    const fetchSavedBriefs = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("saved_briefs")
            .select("id, brief_id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && data) {
            setSavedBriefs(
              data.map((b: { id: string; brief_id: string; created_at: string }) => ({
                id: b.id,
                briefId: b.brief_id,
                savedAt: b.created_at,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching saved briefs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedBriefs();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setSavedBriefs([]);
      } else {
        fetchSavedBriefs();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const saveBrief = useCallback(async (briefId: string) => {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Must be authenticated to save briefs");
    }

    // Use type assertion for insert since schema may not be fully typed
    const { data, error } = await (supabase
      .from("saved_briefs") as any)
      .insert({ user_id: user.id, brief_id: briefId })
      .select()
      .single();

    if (error) throw error;

    setSavedBriefs((prev) => [
      {
        id: data.id,
        briefId: data.brief_id,
        savedAt: data.created_at,
      },
      ...prev,
    ]);
  }, []);

  const unsaveBrief = useCallback(async (briefId: string) => {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Must be authenticated to unsave briefs");
    }

    // Use type assertion for delete since schema may not be fully typed
    const { error } = await (supabase
      .from("saved_briefs") as any)
      .delete()
      .eq("user_id", user.id)
      .eq("brief_id", briefId);

    if (error) throw error;

    setSavedBriefs((prev) => prev.filter((b) => b.briefId !== briefId));
  }, []);

  const isSaved = useCallback(
    (briefId: string) => savedBriefIds.has(briefId),
    [savedBriefIds]
  );

  return {
    savedBriefs,
    savedBriefIds,
    savedCount: savedBriefs.length,
    isLoading,
    saveBrief,
    unsaveBrief,
    isSaved,
  };
}
