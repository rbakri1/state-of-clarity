"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import type {
  AccountabilityInvestigation,
  AccountabilityInvestigationSource,
  ActionPriority,
  RiskLevel,
} from "@/lib/types/accountability";

interface InvestigationWithSources extends AccountabilityInvestigation {
  sources: AccountabilityInvestigationSource[];
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

function getPriorityLabel(priority: ActionPriority) {
  switch (priority) {
    case 1:
      return "Priority 1 (High)";
    case 2:
      return "Priority 2 (Medium)";
    case 3:
      return "Priority 3 (Low)";
  }
}

function SectionFooter() {
  return (
    <div className="mt-6 pt-4 border-t border-gray-400 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
        RESEARCH HYPOTHESIS ONLY — NOT EVIDENCE OF WRONGDOING
      </p>
    </div>
  );
}

export default function PrintPage() {
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

  useEffect(() => {
    if (investigation && !loading) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [investigation, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading investigation...</p>
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">
            Investigation Not Found
          </h1>
          <p className="text-gray-600 mt-2">
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

  const { profile_data, corruption_scenarios, action_items, sources } =
    investigation;

  return (
    <div className="print-document bg-white text-black min-h-screen p-8">
      <style jsx global>{`
        @media print {
          @page {
            margin: 1in;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break {
            page-break-before: always;
          }
          .no-break {
            page-break-inside: avoid;
          }
        }
        .print-document {
          font-family: "Times New Roman", Times, serif;
          line-height: 1.6;
        }
        .print-document h1,
        .print-document h2,
        .print-document h3 {
          font-family: Arial, Helvetica, sans-serif;
        }
      `}</style>

      {/* Title Page */}
      <section className="min-h-[70vh] flex flex-col justify-center items-center text-center">
        <h1 className="text-4xl font-bold mb-4">
          Accountability Investigation Report
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-8">
          {investigation.target_entity}
        </h2>
        <p className="text-lg text-gray-600 mb-12">
          Completed: {completionDate}
        </p>

        {/* Large Disclaimer */}
        <div className="max-w-2xl border-2 border-gray-800 p-6 mt-8">
          <h3 className="text-lg font-bold uppercase mb-4 flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Important Disclaimer
          </h3>
          <p className="text-sm leading-relaxed mb-4">
            This document contains <strong>theoretical research hypotheses only</strong>.
            It does NOT constitute evidence of wrongdoing. All scenarios presented
            are speculative possibilities based on publicly available information.
          </p>
          <p className="text-sm leading-relaxed mb-4">
            <strong>All individuals and organizations are presumed innocent until
            proven guilty in a court of law.</strong>
          </p>
          <p className="text-sm leading-relaxed">
            This report should be used solely as a research starting point for
            legitimate investigative journalism or academic study. Any accusations
            or conclusions based on this document would be unfounded without
            independent verification through proper legal channels.
          </p>
        </div>
      </section>

      {/* Profile Section */}
      <section className="page-break">
        <h2 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-6">
          UK Public Records Profile
        </h2>

        {/* Entity Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Subject Information</h3>
          <p>
            <strong>Name:</strong> {profile_data.fullName}
          </p>
          {profile_data.aliases.length > 0 && (
            <p>
              <strong>Also known as:</strong> {profile_data.aliases.join(", ")}
            </p>
          )}
          {profile_data.dateOfBirth && (
            <p>
              <strong>Date of Birth:</strong> {profile_data.dateOfBirth}
            </p>
          )}
        </div>

        {/* Companies House */}
        {profile_data.companiesHouseEntities.length > 0 && (
          <div className="mb-6 no-break">
            <h3 className="text-lg font-semibold mb-2">Companies House Records</h3>
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Company</th>
                  <th className="border border-gray-400 p-2 text-left">Role</th>
                  <th className="border border-gray-400 p-2 text-left">Status</th>
                  <th className="border border-gray-400 p-2 text-left">Period</th>
                </tr>
              </thead>
              <tbody>
                {profile_data.companiesHouseEntities.map((company, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-400 p-2">
                      {company.companyName} ({company.companyNumber})
                    </td>
                    <td className="border border-gray-400 p-2">{company.role}</td>
                    <td className="border border-gray-400 p-2">{company.companyStatus}</td>
                    <td className="border border-gray-400 p-2">
                      {company.appointedOn || "N/A"}
                      {company.resignedOn && ` - ${company.resignedOn}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Charity Commission */}
        {profile_data.charityInvolvements.length > 0 && (
          <div className="mb-6 no-break">
            <h3 className="text-lg font-semibold mb-2">Charity Commission Records</h3>
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Charity</th>
                  <th className="border border-gray-400 p-2 text-left">Role</th>
                  <th className="border border-gray-400 p-2 text-left">Period</th>
                  <th className="border border-gray-400 p-2 text-left">Income</th>
                </tr>
              </thead>
              <tbody>
                {profile_data.charityInvolvements.map((charity, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-400 p-2">
                      {charity.charityName} ({charity.charityNumber})
                    </td>
                    <td className="border border-gray-400 p-2">{charity.role}</td>
                    <td className="border border-gray-400 p-2">
                      {charity.startDate || "N/A"}
                      {charity.endDate && ` - ${charity.endDate}`}
                    </td>
                    <td className="border border-gray-400 p-2">
                      {charity.charityIncome !== undefined
                        ? `£${charity.charityIncome.toLocaleString()}`
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Register of Interests */}
        {profile_data.registerOfInterests.length > 0 && (
          <div className="mb-6 no-break">
            <h3 className="text-lg font-semibold mb-2">Register of Interests</h3>
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Category</th>
                  <th className="border border-gray-400 p-2 text-left">Description</th>
                  <th className="border border-gray-400 p-2 text-left">Value</th>
                  <th className="border border-gray-400 p-2 text-left">Registered</th>
                </tr>
              </thead>
              <tbody>
                {profile_data.registerOfInterests.map((interest, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-400 p-2">{interest.category}</td>
                    <td className="border border-gray-400 p-2">{interest.description}</td>
                    <td className="border border-gray-400 p-2">{interest.value || "N/A"}</td>
                    <td className="border border-gray-400 p-2">{interest.dateRegistered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Political Donations */}
        {profile_data.politicalDonations.length > 0 && (
          <div className="mb-6 no-break">
            <h3 className="text-lg font-semibold mb-2">Electoral Commission (Donations)</h3>
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Donor/Recipient</th>
                  <th className="border border-gray-400 p-2 text-left">Type</th>
                  <th className="border border-gray-400 p-2 text-left">Amount</th>
                  <th className="border border-gray-400 p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {profile_data.politicalDonations.map((donation, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-400 p-2">
                      {donation.donor || donation.recipient}
                    </td>
                    <td className="border border-gray-400 p-2">{donation.type}</td>
                    <td className="border border-gray-400 p-2">
                      £{donation.amount.toLocaleString()}
                    </td>
                    <td className="border border-gray-400 p-2">{donation.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Government Contracts */}
        {profile_data.governmentContracts.length > 0 && (
          <div className="mb-6 no-break">
            <h3 className="text-lg font-semibold mb-2">Contracts Finder</h3>
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Contract</th>
                  <th className="border border-gray-400 p-2 text-left">Buyer</th>
                  <th className="border border-gray-400 p-2 text-left">Supplier</th>
                  <th className="border border-gray-400 p-2 text-left">Value</th>
                  <th className="border border-gray-400 p-2 text-left">Awarded</th>
                </tr>
              </thead>
              <tbody>
                {profile_data.governmentContracts.map((contract, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-400 p-2">{contract.contractTitle}</td>
                    <td className="border border-gray-400 p-2">{contract.buyer}</td>
                    <td className="border border-gray-400 p-2">{contract.supplier}</td>
                    <td className="border border-gray-400 p-2">
                      £{contract.value.toLocaleString()}
                    </td>
                    <td className="border border-gray-400 p-2">{contract.awardDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <SectionFooter />
      </section>

      {/* Scenarios Section */}
      <section className="page-break">
        <h2 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-6">
          Theoretical Corruption Scenarios
        </h2>

        <div className="mb-6 border border-gray-600 p-4 bg-gray-50">
          <p className="text-sm">
            <strong>⚠️ IMPORTANT:</strong> These are hypothetical scenarios only. They
            represent theoretical possibilities based on positions held, not evidence
            of wrongdoing. Each scenario includes innocent explanations that may be
            more likely. Always assume innocence until proven otherwise.
          </p>
        </div>

        {corruption_scenarios.length === 0 ? (
          <p className="text-gray-600 italic">No scenarios identified.</p>
        ) : (
          corruption_scenarios.map((scenario, idx) => (
            <div key={scenario.scenarioId} className="mb-8 no-break">
              <h3 className="text-lg font-semibold mb-2">
                {idx + 1}. {scenario.title}
                <span className="ml-2 text-sm font-normal text-gray-600">
                  [{getRiskLabel(scenario.riskLevel)}]
                </span>
              </h3>

              <p className="mb-3">{scenario.description}</p>

              {scenario.enablingPositions.length > 0 && (
                <div className="mb-2">
                  <strong>Enabling Positions:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {scenario.enablingPositions.map((pos, pIdx) => (
                      <li key={pIdx}>{pos}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scenario.redFlags.length > 0 && (
                <div className="mb-2">
                  <strong>Red Flags:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {scenario.redFlags.map((flag, fIdx) => (
                      <li key={fIdx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scenario.innocentExplanations.length > 0 && (
                <div className="mb-2 border-l-4 border-gray-400 pl-4">
                  <strong>Innocent Explanations:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {scenario.innocentExplanations.map((exp, eIdx) => (
                      <li key={eIdx}>{exp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scenario.mechanism && (
                <p className="mb-2">
                  <strong>Mechanism:</strong> {scenario.mechanism}
                </p>
              )}

              <p className="text-sm text-gray-600">
                Detection Difficulty: {scenario.detectionDifficulty.replace("_", " ")}
              </p>
            </div>
          ))
        )}

        <SectionFooter />
      </section>

      {/* Action Items Section */}
      <section className="page-break">
        <h2 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-6">
          Investigation Action Items
        </h2>

        <div className="mb-6 border border-gray-600 p-4 bg-gray-50">
          <p className="text-sm">
            <strong>Note:</strong> These are suggested research actions prioritized by
            potential impact. They should be pursued through proper legal and ethical
            channels only.
          </p>
        </div>

        {action_items.length === 0 ? (
          <p className="text-gray-600 italic">No action items identified.</p>
        ) : (
          <>
            {[1, 2, 3].map((priority) => {
              const items = action_items.filter((item) => item.priority === priority);
              if (items.length === 0) return null;

              return (
                <div key={priority} className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 border-b border-gray-400 pb-1">
                    {getPriorityLabel(priority as ActionPriority)}
                  </h3>
                  {items.map((item, idx) => (
                    <div key={item.actionId} className="mb-6 no-break pl-4">
                      <h4 className="font-semibold mb-2">
                        {idx + 1}. {item.action}
                      </h4>
                      <p className="mb-2 text-sm">{item.rationale}</p>
                      <div className="text-sm grid grid-cols-2 gap-2">
                        <p>
                          <strong>Data Source:</strong> {item.dataSource}
                        </p>
                        <p>
                          <strong>Expected Evidence:</strong> {item.expectedEvidence}
                        </p>
                        {item.estimatedTime && (
                          <p>
                            <strong>Est. Time:</strong> {item.estimatedTime}
                          </p>
                        )}
                      </div>
                      {item.legalConsiderations && item.legalConsiderations.length > 0 && (
                        <div className="mt-2 text-sm">
                          <strong>Legal Considerations:</strong>
                          <ul className="list-disc list-inside ml-4">
                            {item.legalConsiderations.map((consideration, cIdx) => (
                              <li key={cIdx}>{consideration}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}

        <SectionFooter />
      </section>

      {/* Sources Section */}
      <section className="page-break">
        <h2 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-6">
          Data Sources
        </h2>

        {sources && sources.length > 0 ? (
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left">Source Type</th>
                <th className="border border-gray-400 p-2 text-left">Title/URL</th>
                <th className="border border-gray-400 p-2 text-left">Accessed</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td className="border border-gray-400 p-2 capitalize">
                    {source.source_type.replace(/_/g, " ")}
                  </td>
                  <td className="border border-gray-400 p-2 break-all">
                    {source.title || source.url}
                  </td>
                  <td className="border border-gray-400 p-2">
                    {new Date(source.accessed_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 italic">
            No external sources recorded for this investigation.
          </p>
        )}

        <SectionFooter />

        {/* Final Disclaimer */}
        <div className="mt-12 border-2 border-gray-800 p-6 text-center">
          <p className="text-sm font-bold uppercase mb-2">End of Report</p>
          <p className="text-xs text-gray-600">
            Generated by State of Clarity Accountability Tracker.
            This document is for research purposes only.
          </p>
        </div>
      </section>
    </div>
  );
}
