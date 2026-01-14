"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Calendar, FileDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileSection from "@/components/accountability/profile-section";
import ScenariosSection from "@/components/accountability/scenarios-section";
import ActionItemsSection from "@/components/accountability/action-items-section";
import type {
  AccountabilityInvestigation,
  AccountabilityInvestigationSource,
} from "@/lib/types/accountability";

interface InvestigationWithSources extends AccountabilityInvestigation {
  sources: AccountabilityInvestigationSource[];
}

export default function InvestigationResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const [investigation, setInvestigation] =
    useState<InvestigationWithSources | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvestigation() {
      try {
        const response = await fetch(`/api/accountability/${id}`);
        if (response.status === 404) {
          setError("Investigation not found");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch investigation");
        }
        const data = await response.json();
        setInvestigation(data.investigation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchInvestigation();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="animate-pulse text-ink-600 font-body">
          Loading investigation...
        </div>
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle
            className="w-12 h-12 text-error-dark mx-auto"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-heading font-semibold text-ink-800">
            Investigation Not Found
          </h1>
          <p className="text-ink-600 font-body">
            {error || "The investigation you're looking for could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const completionDate = new Date(investigation.created_at).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const handleExportPDF = () => {
    window.open(`/accountability/${id}/print`, "_blank");
  };

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-ink-900">
                {investigation.target_entity}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-ink-600 font-body text-sm">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>Completed: {completionDate}</span>
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2",
                "bg-sage-600 text-white font-ui font-medium rounded-lg",
                "hover:bg-sage-700 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              )}
              aria-label="Export investigation as PDF"
            >
              <FileDown className="w-4 h-4" aria-hidden="true" />
              Export PDF
            </button>
          </div>
        </header>

        {/* Ethics Reminder Banner */}
        <div
          className="bg-warning-light border border-warning-dark/20 rounded-lg p-4"
          role="alert"
          aria-live="polite"
        >
          <div className="flex gap-3">
            <AlertTriangle
              className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="font-ui font-semibold text-warning-dark">
                Research Hypothesis Only
              </p>
              <p className="text-sm text-warning-dark/90 font-body">
                This analysis presents theoretical scenarios based on public data.
                All individuals and organizations are presumed innocent until proven
                guilty in a court of law. This document is not evidence of wrongdoing.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <ProfileSection profileData={investigation.profile_data} />

        {/* Scenarios Section */}
        <ScenariosSection scenarios={investigation.corruption_scenarios} />

        {/* Action Items Section */}
        <ActionItemsSection actionItems={investigation.action_items} />

        {/* Sources Footer */}
        <footer className="border-t border-ivory-300 pt-8">
          <h2 className="text-xl font-heading font-semibold text-ink-800 mb-4">
            Data Sources
          </h2>
          {investigation.sources && investigation.sources.length > 0 ? (
            <ul className="space-y-2">
              {investigation.sources.map((source) => (
                <li key={source.id} className="flex items-start gap-2">
                  <ExternalLink
                    className="w-4 h-4 text-sage-600 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "text-sm text-sage-600 hover:text-sage-700 font-body",
                      "underline underline-offset-2",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
                    )}
                  >
                    {source.title || source.url}
                  </a>
                  <span className="text-xs text-ink-400 font-ui">
                    ({source.source_type.replace(/_/g, " ")})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500 font-body">
              No external sources recorded for this investigation.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
