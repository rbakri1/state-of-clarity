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
        return "We didn't receive an authentication code. Please try signing in again.";
      case "exchange_failed":
        return "We couldn't complete your sign-in. Please try again.";
      case "invalid_token":
        return "Your sign-in link has expired. Please request a new one.";
      case "access_denied":
        return "We couldn't grant access. Please check your permissions and try again.";
      default:
        return "We hit an issue during sign-in. Please try again.";
    }
  };

  return (
    <p className="text-ink-500 font-ui text-sm">
      {getErrorMessage(reason)}
    </p>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col">
      <header className="border-b border-ivory-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-ivory-100" />
              </div>
              <span className="text-xl font-semibold font-heading text-ink-800">State of Clarity</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-ivory-50 rounded-xl shadow-sm border border-ivory-600 p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-error-light flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-error" />
              </div>
              <h1 className="text-2xl font-semibold font-heading text-ink-800 mb-3">Authentication Error</h1>
              <Suspense fallback={<p className="text-ink-500 font-ui text-sm">Loading...</p>}>
                <ErrorContent />
              </Suspense>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="w-full py-3 rounded-lg bg-sage-500 text-ivory-100 font-medium font-ui hover:bg-sage-600 active:bg-sage-700 transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                Try again
              </Link>

              <a
                href="mailto:support@stateofclarity.com"
                className="w-full py-3 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-300 transition-all duration-200 flex items-center justify-center gap-2 font-medium font-ui text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                Contact support
              </a>
            </div>

            <p className="mt-6 text-center text-xs text-ink-400 font-ui">
              If this issue persists, please reach out to our support team.
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-ink-500 hover:text-ink-700 font-ui transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
