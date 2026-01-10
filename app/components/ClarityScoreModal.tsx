"use client";

import { useEffect, useRef } from "react";

interface ClarityBreakdown {
  first_principles?: number;
  source_diversity?: number;
  primary_ratio?: number;
  logical_completeness?: number;
  readability?: number;
  recency?: number;
  user_feedback?: number;
}

interface ClarityScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  breakdown: ClarityBreakdown;
  strengths?: string[];
  gaps?: string[];
}

interface Dimension {
  key: keyof ClarityBreakdown;
  name: string;
  weight: number;
}

const DIMENSIONS: Dimension[] = [
  { key: "first_principles", name: "First-Principles", weight: 15 },
  { key: "source_diversity", name: "Source Diversity", weight: 20 },
  { key: "primary_ratio", name: "Primary Source Ratio", weight: 15 },
  { key: "logical_completeness", name: "Logical Completeness", weight: 15 },
  { key: "readability", name: "Readability", weight: 15 },
  { key: "recency", name: "Recency", weight: 10 },
  { key: "user_feedback", name: "User Feedback", weight: 10 },
];

export default function ClarityScoreModal({
  isOpen,
  onClose,
  score,
  breakdown,
  strengths = [],
  gaps = [],
}: ClarityScoreModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const dimensionsWithScores = DIMENSIONS.map((dim) => {
    const rawScore = breakdown[dim.key] ?? 0;
    const normalizedScore = rawScore <= 1 ? rawScore * 10 : rawScore;
    const contribution = (normalizedScore * dim.weight) / 100;
    return {
      ...dim,
      score: normalizedScore,
      contribution,
    };
  });

  const sortedByScore = [...dimensionsWithScores].sort(
    (a, b) => b.score - a.score
  );
  const topDimensions = sortedByScore.slice(0, 2);
  const bottomDimensions = sortedByScore.slice(-2).reverse();

  const displayStrengths =
    strengths.length > 0
      ? strengths.slice(0, 2)
      : topDimensions.map((d) => `Strong ${d.name.toLowerCase()} score`);

  const displayOpportunities =
    gaps.length > 0
      ? gaps.slice(0, 2)
      : bottomDimensions.map((d) => `Improve ${d.name.toLowerCase()}`);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clarity-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2
          id="clarity-modal-title"
          className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100"
        >
          Clarity Score Breakdown
        </h2>

        <div className="mb-6 text-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {score.toFixed(1)}
            <span className="text-2xl text-gray-500">/10</span>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 text-left font-medium text-gray-600 dark:text-gray-400">
                  Dimension
                </th>
                <th className="pb-2 text-center font-medium text-gray-600 dark:text-gray-400">
                  Weight
                </th>
                <th className="pb-2 text-center font-medium text-gray-600 dark:text-gray-400">
                  Score
                </th>
                <th className="pb-2 text-right font-medium text-gray-600 dark:text-gray-400">
                  Contribution
                </th>
              </tr>
            </thead>
            <tbody>
              {dimensionsWithScores.map((dim) => (
                <tr
                  key={dim.key}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {dim.name}
                    </div>
                    <div className="mt-1 h-2 w-full max-w-[150px] overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${dim.score * 10}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                    {dim.weight}%
                  </td>
                  <td className="py-3 text-center font-medium text-gray-900 dark:text-gray-100">
                    {dim.score.toFixed(1)}
                  </td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                    +{dim.contribution.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-green-800 dark:text-green-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Strengths
            </h3>
            <ul className="space-y-1 text-sm text-green-700 dark:text-green-400">
              {displayStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Opportunities
            </h3>
            <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
              {displayOpportunities.map((g, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
