"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, ArrowLeft, ExternalLink } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

interface SavedBrief {
  brief_id: string;
  saved_at: string;
  brief: {
    id: string;
    question: string;
    clarity_score: number | null;
  } | null;
}

export default function SavedBriefsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    const fetchSavedBriefs = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("saved_briefs")
        .select(`
          brief_id,
          saved_at,
          brief:briefs (
            id,
            question,
            clarity_score
          )
        `)
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (!error && data) {
        setSavedBriefs(data as SavedBrief[]);
      }

      setIsLoading(false);
    };

    fetchSavedBriefs();
  }, [router]);

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
              <Bookmark className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Saved Briefs</h1>
              <p className="text-sm text-muted-foreground">
                {savedBriefs.length} brief{savedBriefs.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {savedBriefs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium mb-2">No saved briefs yet</h2>
              <p className="text-muted-foreground mb-4">
                When you save briefs, they&apos;ll appear here for easy access.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Browse briefs
              </Link>
            </div>
          ) : (
            savedBriefs.map((saved) => {
              if (!saved.brief) return null;

              const savedDate = new Date(saved.saved_at).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              );

              return (
                <Link
                  key={saved.brief_id}
                  href={`/brief/${saved.brief.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1 line-clamp-2">
                        {saved.brief.question}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Saved {savedDate}</span>
                        {saved.brief.clarity_score !== null && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  saved.brief.clarity_score >= 8
                                    ? "bg-green-500"
                                    : saved.brief.clarity_score >= 6
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              />
                              {saved.brief.clarity_score.toFixed(1)} clarity
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
