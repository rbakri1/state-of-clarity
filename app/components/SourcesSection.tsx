"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

export interface Source {
  id: string;
  url: string;
  title: string;
  author: string;
  publication_date: string;
  publisher: string;
  source_type: string;
  political_lean: string;
  credibility_score: number;
  excerpt: string;
  accessed_at?: string;
}

interface SourcesSectionProps {
  sources: Source[];
}

function getPoliticalLeanColor(lean: string): string {
  const normalized = lean.toLowerCase();
  if (normalized === "left") return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
  if (normalized === "center-left") return "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300";
  if (normalized === "center") return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  if (normalized === "center-right") return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
  if (normalized === "right") return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
}

function getSourceTypeBadgeColor(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized === "primary") return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
  if (normalized === "secondary") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300";
  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const excerptTruncated = source.excerpt && source.excerpt.length > 200;
  const displayExcerpt = excerptTruncated && !expanded 
    ? source.excerpt.slice(0, 200) + "..." 
    : source.excerpt;

  return (
    <div
      id={`source-${index + 1}`}
      className="source-card p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-shadow hover:shadow-md print:bg-white print:border-gray-300"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {index + 1}
          </span>
          <div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-base hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
            >
              {source.title}
              <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-1">
              <span>{source.author}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>{source.publisher}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>{new Date(source.publication_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3 ml-10">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSourceTypeBadgeColor(source.source_type)}`}>
          {source.source_type}
        </span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPoliticalLeanColor(source.political_lean)}`}>
          {source.political_lean}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Credibility:</span>
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all"
              style={{ width: `${source.credibility_score * 10}%` }}
            />
          </div>
          <span className="font-medium">{source.credibility_score.toFixed(1)}</span>
        </div>
      </div>

      {source.excerpt && (
        <div className="ml-10">
          <p className="text-sm text-muted-foreground italic">
            &ldquo;{displayExcerpt}&rdquo;
          </p>
          {excerptTruncated && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:underline mt-1 font-medium"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function SourcesSection({ sources }: SourcesSectionProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sources ({sources.length})</h2>
      <div className="space-y-4">
        {sources.map((source, index) => (
          <SourceCard key={source.id} source={source} index={index} />
        ))}
      </div>
    </div>
  );
}
