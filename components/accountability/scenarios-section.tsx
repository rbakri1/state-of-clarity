"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
  Lightbulb,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CorruptionScenario, RiskLevel } from "@/lib/types/accountability";

interface ScenariosSectionProps {
  scenarios: CorruptionScenario[];
}

interface ScenarioCardProps {
  scenario: CorruptionScenario;
}

function getRiskBadgeStyles(riskLevel: RiskLevel) {
  switch (riskLevel) {
    case "critical":
    case "high":
      return "bg-error-light text-error-dark border-error-dark/20";
    case "medium":
      return "bg-warning-light text-warning-dark border-warning-dark/20";
    case "low":
    default:
      return "bg-ivory-200 text-ink-600 border-ink-300/20";
  }
}

function getRiskLabel(riskLevel: RiskLevel) {
  switch (riskLevel) {
    case "critical":
      return "Critical Risk";
    case "high":
      return "High Risk";
    case "medium":
      return "Medium Risk";
    case "low":
      return "Low Risk";
  }
}

function ScenarioCard({ scenario }: ScenarioCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-ivory-300 rounded-lg overflow-hidden bg-ivory-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-start justify-between p-4 text-left",
          "hover:bg-ivory-100 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500"
        )}
        aria-expanded={expanded}
        aria-controls={`scenario-${scenario.scenarioId}`}
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-ui font-medium text-ink-800">
              {scenario.title}
            </h3>
            <span
              className={cn(
                "text-xs font-ui font-medium px-2 py-0.5 rounded-full border",
                getRiskBadgeStyles(scenario.riskLevel)
              )}
            >
              {getRiskLabel(scenario.riskLevel)}
            </span>
          </div>
          <p className="text-sm text-ink-600 font-body line-clamp-2">
            {scenario.description}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-ink-500 transition-transform duration-200 flex-shrink-0 mt-1",
            expanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id={`scenario-${scenario.scenarioId}`}
        className={cn(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-[3000px]" : "max-h-0"
        )}
      >
        <div className="p-4 pt-0 border-t border-ivory-300 space-y-4">
          {/* Enabling Positions */}
          {scenario.enablingPositions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-ink-500" aria-hidden="true" />
                <span className="text-sm font-ui font-medium text-ink-700">
                  Enabling Positions
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-ink-600 font-body pl-1">
                {scenario.enablingPositions.map((position, idx) => (
                  <li key={idx}>{position}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Red Flags */}
          {scenario.redFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning-dark" aria-hidden="true" />
                <span className="text-sm font-ui font-medium text-ink-700">
                  Red Flags
                </span>
              </div>
              <ul className="space-y-1.5">
                {scenario.redFlags.map((flag, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-ink-600 font-body flex items-start gap-2"
                  >
                    <span className="text-warning-dark mt-0.5">•</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Innocent Explanations - Highlighted */}
          {scenario.innocentExplanations.length > 0 && (
            <div className="bg-success-light/50 rounded-lg p-3 border border-success-dark/20">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-success-dark" aria-hidden="true" />
                <span className="text-sm font-ui font-medium text-success-dark">
                  Innocent Explanations
                </span>
              </div>
              <ul className="space-y-1.5">
                {scenario.innocentExplanations.map((explanation, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-ink-700 font-body flex items-start gap-2"
                  >
                    <span className="text-success-dark mt-0.5">✓</span>
                    {explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mechanism */}
          {scenario.mechanism && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-ink-500" aria-hidden="true" />
                <span className="text-sm font-ui font-medium text-ink-700">
                  Mechanism
                </span>
              </div>
              <p className="text-sm text-ink-600 font-body">{scenario.mechanism}</p>
            </div>
          )}

          {/* Detection Difficulty */}
          <div className="flex items-center gap-2 pt-2 border-t border-ivory-200">
            <Clock className="w-4 h-4 text-ink-400" aria-hidden="true" />
            <span className="text-xs font-ui text-ink-500">
              Detection Difficulty:{" "}
              <span className="font-medium text-ink-600 capitalize">
                {scenario.detectionDifficulty.replace("_", " ")}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScenariosSection({ scenarios }: ScenariosSectionProps) {
  if (scenarios.length === 0) {
    return (
      <section aria-labelledby="scenarios-heading" className="space-y-4">
        <h2
          id="scenarios-heading"
          className="text-2xl font-heading font-semibold text-ink-800"
        >
          Theoretical Corruption Scenarios
        </h2>
        <div className="flex items-center gap-2 py-8 text-ink-500 justify-center border border-ivory-300 rounded-lg bg-ivory-50">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-body">No scenarios identified</span>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="scenarios-heading" className="space-y-4">
      <h2
        id="scenarios-heading"
        className="text-2xl font-heading font-semibold text-ink-800"
      >
        Theoretical Corruption Scenarios
      </h2>

      {/* Ethics reminder */}
      <div className="bg-warning-light rounded-lg p-4 border border-warning-dark/20">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-sm text-ink-700 font-body">
            <strong className="font-medium">These are hypothetical scenarios only.</strong>{" "}
            They represent theoretical possibilities based on positions held, not
            evidence of wrongdoing. Each scenario includes innocent explanations that
            may be more likely. Always assume innocence until proven otherwise.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.scenarioId} scenario={scenario} />
        ))}
      </div>
    </section>
  );
}
