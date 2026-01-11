"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-red-800">
                  Something went wrong
                </h1>
                <p className="mt-2 text-sm text-red-600">
                  We encountered an unexpected error. Our team has been notified
                  and is working to fix the issue.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try again
                  </button>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition"
                  >
                    {showDetails ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show details
                      </>
                    )}
                  </button>
                </div>

                {showDetails && (
                  <div className="mt-4 p-3 bg-red-100 rounded-md overflow-auto">
                    <p className="text-xs font-mono text-red-800">
                      <strong>Error:</strong> {error.name}
                    </p>
                    <p className="text-xs font-mono text-red-700 mt-1 whitespace-pre-wrap">
                      {error.message}
                    </p>
                    {error.digest && (
                      <p className="text-xs font-mono text-red-600 mt-2">
                        <strong>Error ID:</strong> {error.digest}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
