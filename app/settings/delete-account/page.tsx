"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserClient();

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/profile/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      router.push("/auth/deleted-account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sage-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-ivory-50 rounded-2xl shadow-sm border border-ivory-600 p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-error-light flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-ink-800 mb-2">Delete Account</h1>
              <p className="text-ink-500 text-sm font-ui">
                This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="bg-error-light border border-error/20 rounded-lg p-4 mb-6">
              <h2 className="text-sm font-ui font-semibold text-error-dark mb-2">
                Warning: Permanent Deletion
              </h2>
              <ul className="text-xs text-error-dark/80 space-y-1 font-ui">
                <li>• Your profile and all personal information will be deleted</li>
                <li>• All your saved briefs will be removed</li>
                <li>• Your reading history will be erased</li>
                <li>• Any feedback you&apos;ve submitted will be anonymized</li>
                <li>• This action cannot be reversed</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="confirm"
                  className="block text-sm font-ui font-medium text-ink-800 mb-2"
                >
                  Type <span className="font-bold text-error">DELETE</span> to confirm
                </label>
                <input
                  id="confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full px-4 py-2 rounded-lg border border-ivory-600 bg-ivory-100 text-ink-800 font-ui focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus:border-error outline-none transition-colors"
                  disabled={isDeleting}
                />
              </div>

              {error && (
                <p className="text-sm text-error font-ui">{error}</p>
              )}

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== "DELETE"}
                className="w-full py-3 rounded-lg bg-error text-ivory-100 font-ui font-medium hover:bg-error-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting account...
                  </>
                ) : (
                  "Permanently delete my account"
                )}
              </button>

              <Link
                href="/settings"
                className="w-full py-3 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-200 transition-colors flex items-center justify-center gap-2 font-ui font-medium text-ink-800 focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                Cancel
              </Link>
            </div>
          </div>

          <Link
            href="/settings"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-ink-500 hover:text-ink-800 font-ui transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg p-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to settings
          </Link>
        </div>
      </main>
    </div>
  );
}
