"use client";

import { useState } from "react";
import {
  Building2,
  Heart,
  FileText,
  Vote,
  FileSearch,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UKProfileData, DataCompleteness } from "@/lib/types/accountability";

interface ProfileSectionProps {
  profileData: UKProfileData;
}

interface ExpandableCardProps {
  title: string;
  icon: React.ReactNode;
  hasData: boolean;
  children: React.ReactNode;
  sourceUrl?: string;
}

function DataCompletenessIndicator({
  completeness,
}: {
  completeness: DataCompleteness;
}) {
  const indicators = [
    { label: "Companies House", has: completeness.hasCompaniesHouse },
    { label: "Register of Interests", has: completeness.hasRegisterOfInterests },
    { label: "Charity Data", has: completeness.hasCharityData },
    { label: "Donations", has: completeness.hasDonationsData },
    { label: "Contracts", has: completeness.hasContractsData },
  ];

  const percentage = Math.round(completeness.completenessScore * 100);

  return (
    <div className="bg-ivory-100 rounded-lg p-4 mb-6 border border-ivory-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-ui font-medium text-ink-700">
          Data Completeness
        </span>
        <span
          className={cn(
            "text-sm font-ui font-semibold px-2 py-0.5 rounded",
            percentage >= 70
              ? "bg-success-light text-success-dark"
              : percentage >= 40
              ? "bg-warning-light text-warning-dark"
              : "bg-error-light text-error-dark"
          )}
        >
          {percentage}%
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {indicators.map((indicator) => (
          <div
            key={indicator.label}
            className={cn(
              "flex items-center gap-1.5 text-xs font-ui px-2 py-1 rounded-full",
              indicator.has
                ? "bg-success-light text-success-dark"
                : "bg-ivory-200 text-ink-400"
            )}
          >
            {indicator.has ? (
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
            ) : (
              <XCircle className="w-3 h-3" aria-hidden="true" />
            )}
            {indicator.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpandableCard({
  title,
  icon,
  hasData,
  children,
  sourceUrl,
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-ivory-300 rounded-lg overflow-hidden bg-ivory-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between p-4",
          "hover:bg-ivory-100 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500"
        )}
        aria-expanded={expanded}
        aria-controls={`card-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-sage-600" aria-hidden="true">
            {icon}
          </span>
          <span className="font-ui font-medium text-ink-800">{title}</span>
          {!hasData && (
            <span className="text-xs bg-ivory-200 text-ink-500 px-2 py-0.5 rounded-full">
              No data
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-ink-500 transition-transform duration-200",
            expanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={`card-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className={cn(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-[2000px]" : "max-h-0"
        )}
      >
        <div className="p-4 pt-0 border-t border-ivory-300">
          {hasData ? (
            <>
              {children}
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 mt-4 text-sm text-sage-600 hover:text-sage-700",
                    "focus-visible:outline-none focus-visible:underline"
                  )}
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  View source
                </a>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 py-4 text-ink-500">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-body">No data found for this source</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileSection({ profileData }: ProfileSectionProps) {
  const hasCompanies = profileData.companiesHouseEntities.length > 0;
  const hasCharities = profileData.charityInvolvements.length > 0;
  const hasInterests = profileData.registerOfInterests.length > 0;
  const hasDonations = profileData.politicalDonations.length > 0;
  const hasContracts = profileData.governmentContracts.length > 0;

  const companiesSource = hasCompanies
    ? profileData.companiesHouseEntities[0]?.sourceUrl
    : undefined;
  const charitiesSource = hasCharities
    ? profileData.charityInvolvements[0]?.sourceUrl
    : undefined;
  const interestsSource = hasInterests
    ? profileData.registerOfInterests[0]?.sourceUrl
    : undefined;
  const donationsSource = hasDonations
    ? profileData.politicalDonations[0]?.sourceUrl
    : undefined;
  const contractsSource = hasContracts
    ? profileData.governmentContracts[0]?.sourceUrl
    : undefined;

  return (
    <section aria-labelledby="profile-heading" className="space-y-4">
      <h2
        id="profile-heading"
        className="text-2xl font-heading font-semibold text-ink-800"
      >
        UK Public Records Profile
      </h2>

      <DataCompletenessIndicator completeness={profileData.dataCompleteness} />

      <div className="space-y-3">
        {/* Companies House */}
        <ExpandableCard
          title="Companies House"
          icon={<Building2 className="w-5 h-5" />}
          hasData={hasCompanies}
          sourceUrl={companiesSource}
        >
          <ul className="space-y-3">
            {profileData.companiesHouseEntities.map((company, idx) => (
              <li
                key={`${company.companyNumber}-${idx}`}
                className="border-b border-ivory-200 pb-3 last:border-0 last:pb-0"
              >
                <div className="font-medium text-ink-800 font-body">
                  {company.companyName}
                </div>
                <div className="text-sm text-ink-600 font-body">
                  {company.role} • {company.companyStatus}
                </div>
                <div className="text-xs text-ink-500 font-ui mt-1">
                  Company No: {company.companyNumber}
                  {company.appointedOn && ` • Appointed: ${company.appointedOn}`}
                  {company.resignedOn && ` • Resigned: ${company.resignedOn}`}
                </div>
              </li>
            ))}
          </ul>
        </ExpandableCard>

        {/* Charity Commission */}
        <ExpandableCard
          title="Charity Commission"
          icon={<Heart className="w-5 h-5" />}
          hasData={hasCharities}
          sourceUrl={charitiesSource}
        >
          <ul className="space-y-3">
            {profileData.charityInvolvements.map((charity, idx) => (
              <li
                key={`${charity.charityNumber}-${idx}`}
                className="border-b border-ivory-200 pb-3 last:border-0 last:pb-0"
              >
                <div className="font-medium text-ink-800 font-body">
                  {charity.charityName}
                </div>
                <div className="text-sm text-ink-600 font-body">{charity.role}</div>
                <div className="text-xs text-ink-500 font-ui mt-1">
                  Charity No: {charity.charityNumber}
                  {charity.startDate && ` • From: ${charity.startDate}`}
                  {charity.endDate && ` • To: ${charity.endDate}`}
                  {charity.charityIncome !== undefined &&
                    ` • Income: £${charity.charityIncome.toLocaleString()}`}
                </div>
              </li>
            ))}
          </ul>
        </ExpandableCard>

        {/* Register of Interests */}
        <ExpandableCard
          title="Register of Interests"
          icon={<FileText className="w-5 h-5" />}
          hasData={hasInterests}
          sourceUrl={interestsSource}
        >
          <ul className="space-y-3">
            {profileData.registerOfInterests.map((interest, idx) => (
              <li
                key={`${interest.category}-${idx}`}
                className="border-b border-ivory-200 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-sage-100 text-sage-700 px-2 py-0.5 rounded font-ui">
                    {interest.category}
                  </span>
                </div>
                <div className="text-sm text-ink-700 font-body mt-1.5">
                  {interest.description}
                </div>
                <div className="text-xs text-ink-500 font-ui mt-1">
                  Registered: {interest.dateRegistered}
                  {interest.value && ` • Value: ${interest.value}`}
                </div>
              </li>
            ))}
          </ul>
        </ExpandableCard>

        {/* Electoral Commission */}
        <ExpandableCard
          title="Electoral Commission"
          icon={<Vote className="w-5 h-5" />}
          hasData={hasDonations}
          sourceUrl={donationsSource}
        >
          <ul className="space-y-3">
            {profileData.politicalDonations.map((donation, idx) => (
              <li
                key={`${donation.date}-${idx}`}
                className="border-b border-ivory-200 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-ink-800 font-body">
                    {donation.donor || donation.recipient}
                  </div>
                  <span className="text-sm font-ui font-semibold text-ink-700">
                    £{donation.amount.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-ink-600 font-body">{donation.type}</div>
                <div className="text-xs text-ink-500 font-ui mt-1">
                  Date: {donation.date}
                </div>
              </li>
            ))}
          </ul>
        </ExpandableCard>

        {/* Contracts Finder */}
        <ExpandableCard
          title="Contracts Finder"
          icon={<FileSearch className="w-5 h-5" />}
          hasData={hasContracts}
          sourceUrl={contractsSource}
        >
          <ul className="space-y-3">
            {profileData.governmentContracts.map((contract, idx) => (
              <li
                key={`${contract.awardDate}-${idx}`}
                className="border-b border-ivory-200 pb-3 last:border-0 last:pb-0"
              >
                <div className="font-medium text-ink-800 font-body">
                  {contract.contractTitle}
                </div>
                <div className="text-sm text-ink-600 font-body">
                  {contract.buyer} → {contract.supplier}
                </div>
                <div className="flex items-center justify-between text-xs text-ink-500 font-ui mt-1">
                  <span>Awarded: {contract.awardDate}</span>
                  <span className="font-semibold text-ink-700">
                    £{contract.value.toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </ExpandableCard>
      </div>
    </section>
  );
}
