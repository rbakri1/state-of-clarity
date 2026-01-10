"use client";

import { CollapsibleSection } from "./CollapsibleSection";

interface Definition {
  term: string;
  definition: string;
  source?: string;
  points_of_contention?: string;
}

interface Factor {
  name: string;
  impact: string;
  evidence: string[];
}

interface Policy {
  name: string;
  pros: string[];
  cons: string[];
  evidence?: string[];
}

interface Consequence {
  action: string;
  first_order: string;
  second_order: string;
}

interface HistoricalSummary {
  introduction?: string;
  origins?: string;
  key_milestones?: string[];
  modern_context?: string;
  lessons?: string[];
}

interface StructuredData {
  definitions?: Definition[];
  factors?: Factor[];
  policies?: Policy[];
  consequences?: Consequence[];
}

interface StructuredDataSectionsProps {
  structuredData: StructuredData;
  historicalSummary?: HistoricalSummary;
}

export function StructuredDataSections({
  structuredData,
  historicalSummary,
}: StructuredDataSectionsProps) {
  const { definitions = [], factors = [], policies = [], consequences = [] } = structuredData;

  return (
    <div className="space-y-4">
      {/* Definitions - expanded by default */}
      {definitions.length > 0 && (
        <CollapsibleSection
          title="Definitions"
          itemCount={definitions.length}
          defaultExpanded={true}
        >
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="min-w-[480px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap w-1/4">
                    Term
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                    Definition
                  </th>
                </tr>
              </thead>
              <tbody>
                {definitions.map((def, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <td className="py-3 px-3 align-top font-medium text-primary whitespace-nowrap">
                      {def.term}
                    </td>
                    <td className="py-3 px-3 align-top text-gray-600 dark:text-gray-300">
                      <div>{def.definition}</div>
                      {def.source && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Source: {def.source}
                        </div>
                      )}
                      {def.points_of_contention && (
                        <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                          ⚠ {def.points_of_contention}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Historical Summary - collapsed by default */}
      {historicalSummary && (
        <CollapsibleSection
          title="Historical Summary"
          defaultExpanded={false}
        >
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            {historicalSummary.introduction && (
              <p className="italic">{historicalSummary.introduction}</p>
            )}
            {historicalSummary.origins && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Origins
                </h4>
                <p>{historicalSummary.origins}</p>
              </div>
            )}
            {historicalSummary.key_milestones && historicalSummary.key_milestones.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Key Milestones
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {historicalSummary.key_milestones.map((milestone, i) => (
                    <li key={i}>{milestone}</li>
                  ))}
                </ul>
              </div>
            )}
            {historicalSummary.modern_context && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Modern Context
                </h4>
                <p>{historicalSummary.modern_context}</p>
              </div>
            )}
            {historicalSummary.lessons && historicalSummary.lessons.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Lessons
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {historicalSummary.lessons.map((lesson, i) => (
                    <li key={i}>{lesson}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Factors - expanded by default */}
      {factors.length > 0 && (
        <CollapsibleSection
          title="Factors"
          itemCount={factors.length}
          defaultExpanded={true}
        >
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="min-w-[560px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap" style={{ width: '120px' }}>
                    Factor
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap" style={{ width: '140px' }}>
                    Impact
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {factors.map((factor, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <td className="py-3 px-3 align-top font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {factor.name}
                    </td>
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {factor.impact}
                      </span>
                    </td>
                    <td className="py-3 px-3 align-top text-gray-600 dark:text-gray-300">
                      <ul className="list-disc list-inside space-y-1">
                        {factor.evidence.map((ev, j) => (
                          <li key={j}>{ev}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Policy Suggestions - collapsed by default */}
      {policies.length > 0 && (
        <CollapsibleSection
          title="Policy Suggestions"
          itemCount={policies.length}
          defaultExpanded={false}
        >
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="min-w-[560px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap" style={{ width: '150px' }}>
                    Policy
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                    Pros
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                    Cons
                  </th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <td className="py-3 px-3 align-top font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {policy.name}
                    </td>
                    <td className="py-3 px-3 align-top text-green-700 dark:text-green-400">
                      <ul className="list-disc list-inside space-y-1">
                        {policy.pros.map((pro, j) => (
                          <li key={j}>{pro}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3 px-3 align-top text-red-700 dark:text-red-400">
                      <ul className="list-disc list-inside space-y-1">
                        {policy.cons.map((con, j) => (
                          <li key={j}>{con}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Consequences - collapsed by default */}
      {consequences.length > 0 && (
        <CollapsibleSection
          title="Consequences"
          itemCount={consequences.length}
          defaultExpanded={false}
        >
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="min-w-[560px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap" style={{ width: '150px' }}>
                    Action
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                    First-Order Effects
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                    Second-Order Effects
                  </th>
                </tr>
              </thead>
              <tbody>
                {consequences.map((consequence, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <td className="py-3 px-3 align-top font-medium text-gray-900 dark:text-gray-100">
                      {consequence.action}
                    </td>
                    <td className="py-3 px-3 align-top text-gray-600 dark:text-gray-300">
                      {consequence.first_order}
                    </td>
                    <td className="py-3 px-3 align-top text-gray-600 dark:text-gray-300">
                      {consequence.second_order}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
