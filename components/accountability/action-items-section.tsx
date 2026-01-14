"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  AlertTriangle,
  Scale,
  Target,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionItem, ActionPriority } from "@/lib/types/accountability";

interface ActionItemsSectionProps {
  actionItems: ActionItem[];
}

interface ActionItemCardProps {
  item: ActionItem;
  checked: boolean;
  onToggle: () => void;
}

function getPriorityStyles(priority: ActionPriority) {
  switch (priority) {
    case 1:
      return {
        badge: "bg-error-light text-error-dark border-error-dark/20",
        label: "Priority 1 (High)",
        border: "border-l-error-dark",
      };
    case 2:
      return {
        badge: "bg-warning-light text-warning-dark border-warning-dark/20",
        label: "Priority 2 (Medium)",
        border: "border-l-warning-dark",
      };
    case 3:
    default:
      return {
        badge: "bg-ivory-200 text-ink-600 border-ink-300/20",
        label: "Priority 3 (Low)",
        border: "border-l-ink-400",
      };
  }
}

function ActionItemCard({ item, checked, onToggle }: ActionItemCardProps) {
  const priorityStyles = getPriorityStyles(item.priority);

  return (
    <div
      className={cn(
        "border border-ivory-300 rounded-lg overflow-hidden bg-ivory-50",
        "border-l-4",
        priorityStyles.border,
        checked && "opacity-60"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className={cn(
              "flex-shrink-0 mt-0.5 rounded-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
            )}
            aria-label={checked ? "Mark as incomplete" : "Mark as complete"}
          >
            {checked ? (
              <CheckCircle2
                className="w-5 h-5 text-success-dark"
                aria-hidden="true"
              />
            ) : (
              <Circle className="w-5 h-5 text-ink-400" aria-hidden="true" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3
                className={cn(
                  "font-ui font-medium text-ink-800",
                  checked && "line-through"
                )}
              >
                {item.action}
              </h3>
              <span
                className={cn(
                  "text-xs font-ui font-medium px-2 py-0.5 rounded-full border",
                  priorityStyles.badge
                )}
              >
                {priorityStyles.label}
              </span>
            </div>

            <p className="text-sm text-ink-600 font-body mb-3">
              {item.rationale}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <FileText
                  className="w-4 h-4 text-ink-500 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <span className="font-ui font-medium text-ink-700">
                    Data Source
                  </span>
                  <p className="text-ink-600 font-body">{item.dataSource}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Target
                  className="w-4 h-4 text-ink-500 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <span className="font-ui font-medium text-ink-700">
                    Expected Evidence
                  </span>
                  <p className="text-ink-600 font-body">{item.expectedEvidence}</p>
                </div>
              </div>
            </div>

            {(item.estimatedTime || (item.legalConsiderations && item.legalConsiderations.length > 0)) && (
              <div className="mt-3 pt-3 border-t border-ivory-200 flex flex-wrap gap-4">
                {item.estimatedTime && (
                  <div className="flex items-center gap-2">
                    <Clock
                      className="w-4 h-4 text-ink-400"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-ui text-ink-500">
                      Est. Time:{" "}
                      <span className="font-medium text-ink-600">
                        {item.estimatedTime}
                      </span>
                    </span>
                  </div>
                )}

                {item.legalConsiderations && item.legalConsiderations.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Scale
                      className="w-4 h-4 text-warning-dark flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <span className="text-xs font-ui text-warning-dark font-medium">
                        Legal Considerations:
                      </span>
                      <ul className="text-xs text-ink-600 font-body">
                        {item.legalConsiderations.map((consideration, idx) => (
                          <li key={idx}>• {consideration}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActionItemsSection({
  actionItems,
}: ActionItemsSectionProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (actionId: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  if (actionItems.length === 0) {
    return (
      <section aria-labelledby="actions-heading" className="space-y-4">
        <h2
          id="actions-heading"
          className="text-2xl font-heading font-semibold text-ink-800"
        >
          Investigation Action Items
        </h2>
        <div className="flex items-center gap-2 py-8 text-ink-500 justify-center border border-ivory-300 rounded-lg bg-ivory-50">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-body">No action items identified</span>
        </div>
      </section>
    );
  }

  const groupedItems = {
    1: actionItems.filter((item) => item.priority === 1),
    2: actionItems.filter((item) => item.priority === 2),
    3: actionItems.filter((item) => item.priority === 3),
  };

  const completedCount = checkedItems.size;
  const totalCount = actionItems.length;

  return (
    <section aria-labelledby="actions-heading" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2
          id="actions-heading"
          className="text-2xl font-heading font-semibold text-ink-800"
        >
          Investigation Action Items
        </h2>
        <span className="text-sm font-ui text-ink-500">
          {completedCount} of {totalCount} completed
        </span>
      </div>

      <div className="bg-warning-light rounded-lg p-4 border border-warning-dark/20">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-sm text-ink-700 font-body">
            <strong className="font-medium">Investigation Roadmap.</strong>{" "}
            These are suggested research actions prioritized by potential impact.
            Use checkboxes to track your progress locally (not saved to server).
          </p>
        </div>
      </div>

      {groupedItems[1].length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-ui font-medium text-error-dark flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error-dark" aria-hidden="true" />
            Priority 1 (High)
          </h3>
          <div className="space-y-3">
            {groupedItems[1].map((item) => (
              <ActionItemCard
                key={item.actionId}
                item={item}
                checked={checkedItems.has(item.actionId)}
                onToggle={() => toggleItem(item.actionId)}
              />
            ))}
          </div>
        </div>
      )}

      {groupedItems[2].length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-ui font-medium text-warning-dark flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning-dark" aria-hidden="true" />
            Priority 2 (Medium)
          </h3>
          <div className="space-y-3">
            {groupedItems[2].map((item) => (
              <ActionItemCard
                key={item.actionId}
                item={item}
                checked={checkedItems.has(item.actionId)}
                onToggle={() => toggleItem(item.actionId)}
              />
            ))}
          </div>
        </div>
      )}

      {groupedItems[3].length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-ui font-medium text-ink-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ink-400" aria-hidden="true" />
            Priority 3 (Low)
          </h3>
          <div className="space-y-3">
            {groupedItems[3].map((item) => (
              <ActionItemCard
                key={item.actionId}
                item={item}
                checked={checkedItems.has(item.actionId)}
                onToggle={() => toggleItem(item.actionId)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
