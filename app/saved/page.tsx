"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Bookmark,
  Trash2,
  Loader2,
  ArrowLeft,
  BookmarkX,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";

interface SavedBrief {
  brief_id: string;
  saved_at: string;
  brief: {
    id: string;
    question: string;
    clarity_score: number | null;
    updated_at: string;
    metadata: { tags: string[] };
  } | null;
}

export default function SavedBriefsPage() {
  const router = useRouter();
  const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const supabase = createBrowserClient();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setIsAuthenticated(true);

      // Fetch saved briefs with brief details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("saved_briefs")
        .select(
          `
          brief_id,
          saved_at,
          brief:briefs (
            id,
            question,
            clarity_score,
            updated_at,
            metadata
          )
        `
        )
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (error) {
        console.error("Error fetching saved briefs:", error);
      } else {
        setSavedBriefs(data || []);
      }

      setIsLoading(false);
    };

    checkAuthAndFetch();
  }, [router, supabase]);

  const handleRemove = async (briefId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setRemovingIds((prev) => new Set([...prev, briefId]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("saved_briefs")
      .delete()
      .eq("user_id", user.id)
      .eq("brief_id", briefId);

    if (error) {
      console.error("Error removing saved brief:", error);
    } else {
      setSavedBriefs((prev) => prev.filter((sb) => sb.brief_id !== briefId));
    }

    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.delete(briefId);
      return next;
    });
  };

  const getClarityScoreClass = (score: number | null) => {
    if (!score) return "low";
    if (score >= 8) return "high";
    if (score >= 6) return "medium";
    return "low";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bookmark className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Saved Briefs</h1>
            <p className="text-sm text-muted-foreground">
              {savedBriefs.length}{" "}
              {savedBriefs.length === 1 ? "brief" : "briefs"} saved
            </p>
          </div>
        </div>

        {/* Saved Briefs List */}
        {savedBriefs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <BookmarkX className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No saved briefs yet</h2>
            <p className="text-muted-foreground mb-6">
              When you find briefs you want to read later, save them here for
              quick access.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              <Sparkles className="w-4 h-4" />
              Explore briefs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedBriefs.map((saved) => (
              <div
                key={saved.brief_id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-primary/50 transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/brief/${saved.brief_id}`}
                    className="flex-1 min-w-0"
                  >
                    <h2 className="font-semibold text-lg group-hover:text-primary transition line-clamp-2">
                      {saved.brief?.question || "Untitled Brief"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {saved.brief?.clarity_score && (
                        <span
                          className={`clarity-score-badge ${getClarityScoreClass(
                            saved.brief.clarity_score
                          )} text-xs`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {saved.brief.clarity_score}/10
                        </span>
                      )}
                      <span>
                        Saved{" "}
                        {new Date(saved.saved_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {saved.brief?.updated_at && (
                        <>
                          <span>•</span>
                          <span>
                            Updated{" "}
                            {new Date(
                              saved.brief.updated_at
                            ).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>

                    {saved.brief?.metadata?.tags && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {saved.brief.metadata.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>

                  <button
                    onClick={() => handleRemove(saved.brief_id)}
                    disabled={removingIds.has(saved.brief_id)}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition shrink-0"
                    title="Remove from saved"
                  >
                    {removingIds.has(saved.brief_id) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
