"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { useAuthModal } from "@/app/components/auth/AuthModal";

interface SaveBriefButtonProps {
  briefId: string;
  className?: string;
  showLabel?: boolean;
}

export function SaveBriefButton({
  briefId,
  className = "",
  showLabel = false,
}: SaveBriefButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { openModal } = useAuthModal();

  const supabase = createBrowserClient();

  useEffect(() => {
    const checkSaveStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);

      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check if brief is saved
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("saved_briefs")
        .select("brief_id")
        .eq("user_id", user.id)
        .eq("brief_id", briefId)
        .single();

      setIsSaved(!!data);
      setIsLoading(false);
    };

    checkSaveStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id ?? null;
      setUserId(newUserId);
      if (newUserId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("saved_briefs")
          .select("brief_id")
          .eq("user_id", newUserId)
          .eq("brief_id", briefId)
          .single();

        setIsSaved(!!data);
      } else {
        setIsSaved(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [briefId, supabase]);

  const handleToggleSave = useCallback(async () => {
    if (!userId) {
      openModal();
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        // Remove from saved
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("saved_briefs")
          .delete()
          .eq("user_id", userId)
          .eq("brief_id", briefId);
        setIsSaved(false);
      } else {
        // Add to saved
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("saved_briefs").insert({
          user_id: userId,
          brief_id: briefId,
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSaved, briefId, supabase, openModal]);

  const Icon = isSaved ? BookmarkCheck : Bookmark;

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading}
      className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-2 ${
        isSaved ? "text-primary" : ""
      } ${className}`}
      title={isSaved ? "Remove from saved" : "Save brief"}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Icon className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
      )}
      {showLabel && (
        <span className="text-sm">{isSaved ? "Saved" : "Save"}</span>
      )}
    </button>
  );
}
