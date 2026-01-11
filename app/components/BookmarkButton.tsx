"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface BookmarkButtonProps {
  briefId: string;
}

export function BookmarkButton({ briefId }: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        const response = await fetch(`/api/briefs/${briefId}/save`);
        const data = await response.json();
        setIsSaved(data.saved);
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error("Error checking saved status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSavedStatus();
  }, [briefId]);

  const handleToggleSave = useCallback(async () => {
    if (isAuthenticated === false) {
      setShowSignInPrompt(true);
      return;
    }

    const previousState = isSaved;
    setIsSaved(!isSaved);

    try {
      const response = await fetch(`/api/briefs/${briefId}/save`, {
        method: isSaved ? "DELETE" : "POST",
      });

      if (!response.ok) {
        setIsSaved(previousState);
        const data = await response.json();
        if (response.status === 401) {
          setIsAuthenticated(false);
          setShowSignInPrompt(true);
        } else {
          console.error("Error toggling save:", data.error);
        }
      }
    } catch (error) {
      setIsSaved(previousState);
      console.error("Error toggling save:", error);
    }
  }, [briefId, isSaved, isAuthenticated]);

  const handleDismissPrompt = useCallback(() => {
    setShowSignInPrompt(false);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={handleToggleSave}
        disabled={isLoading}
        className={`p-2 rounded-lg transition ${
          isSaved
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label={isSaved ? "Remove from saved briefs" : "Save this brief"}
        title={isSaved ? "Remove from saved" : "Save brief"}
      >
        {isSaved ? (
          <BookmarkCheck className="w-5 h-5" />
        ) : (
          <Bookmark className="w-5 h-5" />
        )}
      </button>

      {showSignInPrompt && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleDismissPrompt}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium mb-3">
              Sign in to save briefs
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Create a free account to save briefs and access them from any device.
            </p>
            <div className="flex gap-2">
              <a
                href="/auth/sign-in"
                className="flex-1 px-3 py-2 text-sm font-medium text-center text-white bg-primary rounded-lg hover:opacity-90 transition"
              >
                Sign in
              </a>
              <button
                onClick={handleDismissPrompt}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                Later
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
