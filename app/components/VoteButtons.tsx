"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import Link from "next/link";

interface VoteButtonsProps {
  briefId: string;
}

interface VoteState {
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
}

export default function VoteButtons({ briefId }: VoteButtonsProps) {
  const [voteState, setVoteState] = useState<VoteState>({
    upvotes: 0,
    downvotes: 0,
    userVote: null,
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      const res = await fetch(`/api/briefs/${briefId}/vote`);
      if (res.ok) {
        const data = await res.json();
        setVoteState(data);
      }
      setIsLoading(false);
    };
    init();
  }, [briefId]);

  const handleVote = async (voteType: "up" | "down") => {
    if (isAuthenticated === false) {
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    const previousState = { ...voteState };

    if (voteState.userVote === voteType) {
      setVoteState({
        upvotes: voteType === "up" ? voteState.upvotes - 1 : voteState.upvotes,
        downvotes: voteType === "down" ? voteState.downvotes - 1 : voteState.downvotes,
        userVote: null,
      });

      const res = await fetch(`/api/briefs/${briefId}/vote`, { method: "DELETE" });
      if (!res.ok) {
        setVoteState(previousState);
      }
    } else {
      const wasOpposite = voteState.userVote !== null;
      setVoteState({
        upvotes:
          voteType === "up"
            ? voteState.upvotes + 1
            : wasOpposite && voteState.userVote === "up"
            ? voteState.upvotes - 1
            : voteState.upvotes,
        downvotes:
          voteType === "down"
            ? voteState.downvotes + 1
            : wasOpposite && voteState.userVote === "down"
            ? voteState.downvotes - 1
            : voteState.downvotes,
        userVote: voteType,
      });

      const res = await fetch(`/api/briefs/${briefId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote_type: voteType }),
      });
      if (!res.ok) {
        setVoteState(previousState);
      }
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-muted-foreground">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm">{voteState.upvotes}</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-muted-foreground">
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm">{voteState.downvotes}</span>
        </div>
        <Link
          href="/auth/signin"
          className="text-xs text-primary hover:underline ml-2"
        >
          Sign in to vote
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote("up")}
        disabled={isSubmitting}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition ${
          voteState.userVote === "up"
            ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label="Upvote"
      >
        <ThumbsUp
          className={`w-4 h-4 ${voteState.userVote === "up" ? "fill-current" : ""}`}
        />
        <span className="text-sm">{voteState.upvotes}</span>
      </button>
      <button
        onClick={() => handleVote("down")}
        disabled={isSubmitting}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition ${
          voteState.userVote === "down"
            ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label="Downvote"
      >
        <ThumbsDown
          className={`w-4 h-4 ${voteState.userVote === "down" ? "fill-current" : ""}`}
        />
        <span className="text-sm">{voteState.downvotes}</span>
      </button>
    </div>
  );
}
