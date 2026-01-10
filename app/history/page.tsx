"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Clock,
  BookOpen,
  Calendar,
  User,
  MessageCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { useReadingHistory } from "@/lib/reading-history/useReadingHistory";
import { useQuestionHistory } from "@/lib/question-history/useQuestionHistory";

export default function HistoryPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"reading" | "questions">("reading");
  const { history, isLoading } = useReadingHistory();
  const { questions, isLoading: questionsLoading } = useQuestionHistory();

  const supabase = createBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [router, supabase]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const formatTimeSpent = (seconds: number | null): string => {
    if (!seconds || seconds === 0) return "< 1 min";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatReadingLevel = (level: string | null): string => {
    if (!level) return "Unknown";
    const labels: { [key: string]: string } = {
      child: "Child (8-12)",
      teen: "Teen (13-17)",
      undergrad: "Undergrad",
      postdoc: "Post-doc",
    };
    return labels[level] || level;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">State of Clarity</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">History</h1>
            <p className="text-muted-foreground">
              Your reading and question history
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("reading")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === "reading"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Reading ({history.length})
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === "questions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Questions ({questions.length})
          </button>
        </div>

        {/* Reading History Tab */}
        {activeTab === "reading" && (isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
              >
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No reading history yet</h2>
            <p className="text-muted-foreground mb-6">
              Start exploring briefs to build your reading history.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              <Sparkles className="w-4 h-4" />
              Explore Briefs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <Link
                key={entry.brief_id}
                href={`/brief/${entry.brief_id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-primary/50 transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition truncate">
                      {entry.brief?.question || "Untitled Brief"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(entry.read_at)}</span>
                      </div>

                      {entry.reading_level_viewed && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{formatReadingLevel(entry.reading_level_viewed)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeSpent(entry.time_spent_seconds)}</span>
                      </div>
                    </div>

                    {entry.brief?.metadata?.tags && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {entry.brief.metadata.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {entry.brief?.clarity_score && (
                    <div className="clarity-score-badge high shrink-0">
                      <Sparkles className="w-3 h-3" />
                      <span>{entry.brief.clarity_score}/10</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ))}

        {/* Questions History Tab */}
        {activeTab === "questions" && (questionsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
              >
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No questions yet</h2>
            <p className="text-muted-foreground mb-6">
              Ask a question on the homepage to get started.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              <Sparkles className="w-4 h-4" />
              Ask a Question
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">
                      {entry.question}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(entry.asked_at)}</span>
                      </div>

                      {entry.brief_id && (
                        <Link
                          href={`/brief/${entry.brief_id}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View Brief</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/?q=${encodeURIComponent(entry.question)}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition text-sm font-medium shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-ask
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>
    </div>
  );
}
