"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw, Home, Sparkles } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-error-light flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-error" />
              </div>
              <h1 className="text-2xl font-semibold font-heading text-ink-800 mb-2">
                We hit an unexpected error
              </h1>
              <p className="text-ink-500 font-ui text-sm">
                We&apos;re looking into it. You can try refreshing the page or head back to the homepage.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => reset()}
                className="w-full py-3 rounded-lg bg-sage-500 text-ivory-100 font-medium font-ui hover:bg-sage-600 active:bg-sage-700 transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>

              <Link
                href="/"
                className="w-full py-3 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-300 transition-all duration-200 flex items-center justify-center gap-2 font-medium font-ui text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                <Home className="w-4 h-4" />
                Go to homepage
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-ink-400 font-ui">
              If this keeps happening, please{" "}
              <a
                href="mailto:support@stateofclarity.com"
                className="text-ink-500 hover:text-sage-600 underline underline-offset-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
              >
                contact our support team
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
