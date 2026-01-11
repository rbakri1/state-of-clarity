"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, AlertCircle, ArrowLeft } from "lucide-react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const getErrorMessage = (reason: string | null): string => {
    switch (reason) {
      case "no_code":
        return "No authentication code was provided. Please try signing in again.";
      case "exchange_failed":
        return "We couldn't complete the sign-in process. Please try again.";
      case "invalid_token":
        return "Your sign-in link has expired or is invalid. Please request a new one.";
      case "access_denied":
        return "Access was denied. Please check your permissions and try again.";
      default:
        return "Something went wrong during sign-in. Please try again.";
    }
  };

  return (
    <p className="text-muted-foreground">
      {getErrorMessage(reason)}
    </p>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
              <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
                <ErrorContent />
              </Suspense>
            </div>

            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                Try again
              </Link>

              <a
                href="mailto:support@stateofclarity.com"
                className="w-full py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2 font-medium"
              >
                Contact support
              </a>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
