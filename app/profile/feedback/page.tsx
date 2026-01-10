"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import {
  Sparkles,
  LinkIcon,
  AlertTriangle,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  XCircle,
  Flag,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type FeedbackStatus = "pending" | "approved" | "rejected" | "flagged";

interface Vote {
  id: string;
  brief_id: string;
  vote_type: "up" | "down";
  created_at: string;
}

interface SourceSuggestion {
  id: string;
  brief_id: string;
  url: string;
  title: string | null;
  status: FeedbackStatus;
  created_at: string;
}

interface ErrorReport {
  id: string;
  brief_id: string;
  error_type: string;
  description: string;
  status: FeedbackStatus;
  created_at: string;
}

interface EditProposal {
  id: string;
  brief_id: string;
  section: string;
  proposed_text: string;
  status: FeedbackStatus;
  created_at: string;
}

interface FeedbackItem {
  id: string;
  type: "vote" | "source_suggestion" | "error_report" | "edit_proposal";
  brief_id: string;
  status?: FeedbackStatus;
  created_at: string;
  summary: string;
}

const BRIEF_TITLES: Record<string, string> = {
  "uk-four-day-week": "UK's Four-Day Work Week Trial",
  "what-is-a-state": "What is a State?",
};

function getBriefTitle(briefId: string): string {
  return BRIEF_TITLES[briefId] || briefId;
}

export default function UserFeedbackHistoryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      await fetchFeedback();
      setIsLoading(false);
    };

    checkAuthAndFetch();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch("/api/profile/feedback");
      if (res.ok) {
        const data = await res.json();

        const items: FeedbackItem[] = [];

        (data.votes as Vote[]).forEach((vote) => {
          items.push({
            id: vote.id,
            type: "vote",
            brief_id: vote.brief_id,
            created_at: vote.created_at,
            summary: vote.vote_type === "up" ? "Upvoted" : "Downvoted",
          });
        });

        (data.source_suggestions as SourceSuggestion[]).forEach((s) => {
          items.push({
            id: s.id,
            type: "source_suggestion",
            brief_id: s.brief_id,
            status: s.status,
            created_at: s.created_at,
            summary: s.title || s.url,
          });
        });

        (data.error_reports as ErrorReport[]).forEach((e) => {
          items.push({
            id: e.id,
            type: "error_report",
            brief_id: e.brief_id,
            status: e.status,
            created_at: e.created_at,
            summary: `${e.error_type}: ${e.description.slice(0, 50)}${e.description.length > 50 ? "..." : ""}`,
          });
        });

        (data.edit_proposals as EditProposal[]).forEach((ep) => {
          items.push({
            id: ep.id,
            type: "edit_proposal",
            brief_id: ep.brief_id,
            status: ep.status,
            created_at: ep.created_at,
            summary: `${ep.section}: ${ep.proposed_text.slice(0, 50)}${ep.proposed_text.length > 50 ? "..." : ""}`,
          });
        });

        items.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setFeedbackItems(items);
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    }
  };

  const getTypeIcon = (type: FeedbackItem["type"], summary?: string) => {
    switch (type) {
      case "vote":
        return summary === "Upvoted" ? (
          <ThumbsUp className="w-4 h-4 text-green-500" />
        ) : (
          <ThumbsDown className="w-4 h-4 text-red-500" />
        );
      case "source_suggestion":
        return <LinkIcon className="w-4 h-4 text-blue-500" />;
      case "error_report":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "edit_proposal":
        return <Edit3 className="w-4 h-4 text-purple-500" />;
    }
  };

  const getTypeLabel = (type: FeedbackItem["type"]) => {
    switch (type) {
      case "vote":
        return "Vote";
      case "source_suggestion":
        return "Source Suggestion";
      case "error_report":
        return "Error Report";
      case "edit_proposal":
        return "Edit Proposal";
    }
  };

  const getStatusIcon = (status: FeedbackStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "flagged":
        return <Flag className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusBadgeClass = (status: FeedbackStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "flagged":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">My Feedback</span>
            </Link>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">State of Clarity</span>
            </Link>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your feedback history.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">My Feedback</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Your Feedback History</h1>
          <p className="text-muted-foreground">
            All your votes, source suggestions, error reports, and edit
            proposals
          </p>
        </div>

        {feedbackItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-muted-foreground">
              You haven&apos;t submitted any feedback yet.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Browse Briefs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbackItems.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={`/brief/${item.brief_id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getTypeIcon(item.type, item.summary)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-muted-foreground">
                      {getTypeLabel(item.type)}
                    </p>
                    <p className="font-semibold truncate">
                      {getBriefTitle(item.brief_id)}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {item.status && (
                      <span
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(item.status)}`}
                      >
                        {getStatusIcon(item.status)}
                        {item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
