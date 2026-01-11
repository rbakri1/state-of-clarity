"use client";

import { AlertCircle, RefreshCw, CreditCard, Lightbulb } from "lucide-react";

interface GenerationFailedProps {
  question: string;
  creditsRefunded?: number;
  onTryAgain: () => void;
  hasAutoRetry?: boolean;
}

export default function GenerationFailed({
  question,
  creditsRefunded = 1,
  onTryAgain,
  hasAutoRetry = true,
}: GenerationFailedProps) {
  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              We couldn&apos;t generate a high-quality brief for this question
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              Our quality assurance system determined that we couldn&apos;t produce a brief
              that meets our standards for this particular question.
            </p>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-red-100 dark:border-red-900">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your question:</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 italic">
                &ldquo;{question}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">
                {creditsRefunded} credit{creditsRefunded !== 1 ? "s" : ""} refunded to your account
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Suggestions
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
                <li>Try rephrasing your question with more specific terms</li>
                <li>Consider asking about a related topic with more available information</li>
                {hasAutoRetry && (
                  <li>
                    Wait for our automatic retry system to attempt generation with different parameters
                  </li>
                )}
              </ul>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={onTryAgain}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
