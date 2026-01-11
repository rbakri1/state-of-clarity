"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title,
  message,
  details,
  onRetry,
}: ErrorMessageProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              {title}
            </h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">
              {message}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </button>
              )}
              {details && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition"
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
              )}
            </div>

            {showDetails && details && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-md overflow-auto">
                <pre className="text-xs font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap max-h-32 overflow-auto">
                  {details}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
