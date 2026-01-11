"use client";

/**
 * Feedback Form Component
 *
 * Allows users to submit feedback on briefs (upvote, downvote, suggest source, spot error).
 * Respects anonymous_posting preference - user_id is still stored for tracking/payment
 * but display name shows as "Anonymous User" when enabled.
 */

import { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  AlertCircle,
  User,
  Check,
  X,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { useUserDisplay } from "@/lib/user/useUserDisplay";
import { useAuthModal } from "@/app/components/auth/AuthModal";

type FeedbackType =
  | "upvote"
  | "downvote"
  | "suggest_source"
  | "spot_error"
  | "edit_proposal";

interface FeedbackFormProps {
  briefId: string;
}

export function FeedbackForm({ briefId }: FeedbackFormProps) {
  const { userId, displayName, isAnonymous, isAuthenticated, isLoading } =
    useUserDisplay();
  const { openModal } = useAuthModal();

  const [submitting, setSubmitting] = useState<FeedbackType | null>(null);
  const [showContentForm, setShowContentForm] = useState<FeedbackType | null>(
    null
  );
  const [content, setContent] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [votedType, setVotedType] = useState<"upvote" | "downvote" | null>(
    null
  );

  const submitFeedback = async (type: FeedbackType, feedbackContent?: string) => {
    if (!isAuthenticated) {
      openModal();
      return;
    }

    setSubmitting(type);
    setError(null);

    try {
      const supabase = createBrowserClient();

      // Insert feedback - user_id is always stored for tracking/payment
      // even when anonymous_posting is enabled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from("feedback")
        .insert({
          brief_id: briefId,
          user_id: userId,
          type,
          content: feedbackContent || null,
        });

      if (insertError) throw insertError;

      // Track vote type for UI state
      if (type === "upvote" || type === "downvote") {
        setVotedType(type);
      }

      setSuccessMessage(
        type === "upvote"
          ? "Thanks for the feedback!"
          : type === "downvote"
          ? "Thanks for letting us know"
          : "Feedback submitted successfully"
      );
      setShowContentForm(null);
      setContent("");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleQuickFeedback = (type: "upvote" | "downvote") => {
    submitFeedback(type);
  };

  const handleOpenContentForm = (type: FeedbackType) => {
    if (!isAuthenticated) {
      openModal();
      return;
    }
    setShowContentForm(type);
    setError(null);
  };

  const handleSubmitContent = () => {
    if (showContentForm && content.trim()) {
      submitFeedback(showContentForm, content.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4">Help Improve This Brief</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Found an issue or have a suggestion? Your feedback helps make this brief
        more accurate and useful.
      </p>

      {/* Anonymous posting indicator */}
      {isAuthenticated && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <User className="w-4 h-4" />
          <span>
            Posting as:{" "}
            <span className="font-medium text-foreground">{displayName}</span>
          </span>
          {isAnonymous && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Anonymous mode
            </span>
          )}
        </div>
      )}

      {/* Success/Error messages */}
      {successMessage && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Check className="w-4 h-4" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Quick feedback buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => handleQuickFeedback("upvote")}
          disabled={submitting === "upvote" || votedType !== null}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
            votedType === "upvote"
              ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          } disabled:opacity-50`}
        >
          <ThumbsUp
            className={`w-4 h-4 ${votedType === "upvote" ? "fill-current" : ""}`}
          />
          <span className="text-sm">Helpful</span>
        </button>

        <button
          onClick={() => handleQuickFeedback("downvote")}
          disabled={submitting === "downvote" || votedType !== null}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
            votedType === "downvote"
              ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          } disabled:opacity-50`}
        >
          <ThumbsDown
            className={`w-4 h-4 ${votedType === "downvote" ? "fill-current" : ""}`}
          />
          <span className="text-sm">Not Helpful</span>
        </button>

        <button
          onClick={() => handleOpenContentForm("suggest_source")}
          disabled={submitting === "suggest_source"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm">Suggest Source</span>
        </button>

        <button
          onClick={() => handleOpenContentForm("spot_error")}
          disabled={submitting === "spot_error"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Spot Error</span>
        </button>
      </div>

      {/* Content form for suggestions/errors */}
      {showContentForm && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium mb-2">
            {showContentForm === "suggest_source"
              ? "Suggest a source URL or describe the source:"
              : "Describe the error you found:"}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              showContentForm === "suggest_source"
                ? "https://example.com/source or describe the source..."
                : "Describe what's incorrect and what the correct information should be..."
            }
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubmitContent}
              disabled={!content.trim() || submitting !== null}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
            >
              Submit
            </button>
            <button
              onClick={() => {
                setShowContentForm(null);
                setContent("");
              }}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sign in prompt for unauthenticated users */}
      {!isAuthenticated && (
        <p className="text-sm text-muted-foreground mt-4">
          <button
            onClick={() => openModal()}
            className="text-primary hover:underline"
          >
            Sign in
          </button>{" "}
          to submit feedback and help improve this brief.
        </p>
      )}
    </section>
  );
}
