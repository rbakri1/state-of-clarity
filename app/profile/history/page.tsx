"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { History, ArrowLeft, ExternalLink, Clock } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

interface ReadingHistoryItem {
  brief_id: string;
  last_viewed_at: string;
  scroll_depth: number | null;
  brief: {
    id: string;
    question: string;
    clarity_score: number | null;
  } | null;
}

export default function ReadingHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    const fetchReadingHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("reading_history")
        .select(`
          brief_id,
          last_viewed_at,
          scroll_depth,
          brief:briefs (
            id,
            question,
            clarity_score
          )
        `)
        .eq("user_id", user.id)
        .order("last_viewed_at", { ascending: false });

      if (!error && data) {
        setHistory(data as ReadingHistoryItem[]);
      }

      setIsLoading(false);
    };

    fetchReadingHistory();
  }, [router]);

  const formatScrollDepth = (depth: number | null): string => {
    if (depth === null) return "—";
    return `${Math.round(depth * 100)}%`;
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Reading History</h1>
              <p className="text-sm text-muted-foreground">
                {history.length} brief{history.length !== 1 ? "s" : ""} viewed
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium mb-2">No reading history yet</h2>
              <p className="text-muted-foreground mb-4">
                Briefs you read will appear here so you can easily find them again.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Browse briefs
              </Link>
            </div>
          ) : (
            history.map((item) => {
              if (!item.brief) return null;

              return (
                <Link
                  key={item.brief_id}
                  href={`/brief/${item.brief.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1 line-clamp-2">
                        {item.brief.question}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatRelativeTime(item.last_viewed_at)}
                        </span>
                        <span>•</span>
                        <span>{formatScrollDepth(item.scroll_depth)} read</span>
                        {item.brief.clarity_score !== null && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  item.brief.clarity_score >= 8
                                    ? "bg-green-500"
                                    : item.brief.clarity_score >= 6
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              />
                              {item.brief.clarity_score.toFixed(1)} clarity
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
