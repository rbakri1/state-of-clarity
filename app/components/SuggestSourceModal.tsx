"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Link2, CheckCircle } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";

interface SuggestSourceModalProps {
  briefId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const POLITICAL_LEAN_OPTIONS = [
  { value: "", label: "Select political lean..." },
  { value: "left", label: "Left" },
  { value: "center-left", label: "Center-Left" },
  { value: "center", label: "Center" },
  { value: "center-right", label: "Center-Right" },
  { value: "right", label: "Right" },
  { value: "unknown", label: "Unknown" },
];

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

export default function SuggestSourceModal({
  briefId,
  open,
  onOpenChange,
}: SuggestSourceModalProps) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [title, setTitle] = useState("");
  const [publisher, setPublisher] = useState("");
  const [politicalLean, setPoliticalLean] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const checkAuth = async () => {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      checkAuth();
      setShowSuccess(false);
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const resetForm = () => {
    setUrl("");
    setUrlError("");
    setTitle("");
    setPublisher("");
    setPoliticalLean("");
    setNotes("");
  };

  const handleUrlBlur = () => {
    if (url && !isValidUrl(url)) {
      setUrlError("Please enter a valid URL");
    } else {
      setUrlError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidUrl(url)) {
      setUrlError("Please enter a valid URL");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/briefs/${briefId}/suggest-source`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title: title || undefined,
          publisher: publisher || undefined,
          political_lean: politicalLean || undefined,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          setShowSuccess(false);
          resetForm();
        }, 1500);
      } else {
        const data = await res.json();
        setUrlError(data.error || "Failed to submit suggestion");
      }
    } catch {
      setUrlError("Failed to submit suggestion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUrlValid = url && isValidUrl(url);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                Source Suggested!
              </Dialog.Title>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Thank you for your contribution.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Suggest a Source
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              {isAuthenticated === false ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please sign in to suggest a source.
                  </p>
                  <a
                    href="/auth/signin"
                    className="inline-block px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  >
                    Sign In
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="url"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        if (urlError) setUrlError("");
                      }}
                      onBlur={handleUrlBlur}
                      placeholder="https://example.com/article"
                      className={`w-full px-3 py-2 border rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        urlError
                          ? "border-error focus-visible:ring-error"
                          : "border-ivory-600 dark:border-gray-600 focus-visible:ring-sage-500"
                      }`}
                    />
                    {urlError && (
                      <p className="text-red-500 text-sm mt-1">{urlError}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Article title"
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="publisher"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Publisher
                    </label>
                    <input
                      type="text"
                      id="publisher"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="e.g., New York Times"
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="politicalLean"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Political Lean
                    </label>
                    <select
                      id="politicalLean"
                      value={politicalLean}
                      onChange={(e) => setPoliticalLean(e.target.value)}
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    >
                      {POLITICAL_LEAN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Why is this source relevant?"
                      rows={3}
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isUrlValid || isSubmitting}
                    className={`w-full py-2.5 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
                      isUrlValid && !isSubmitting
                        ? "bg-sage-500 text-white hover:bg-sage-600"
                        : "bg-ivory-400 dark:bg-gray-700 text-ink-400 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Suggestion"}
                  </button>
                </form>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
