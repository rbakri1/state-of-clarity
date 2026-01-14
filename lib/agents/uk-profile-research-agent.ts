/**
 * UK Profile Research Agent
 *
 * Fetches UK public data and synthesizes it into a structured profile
 * using Claude Opus for high-quality synthesis.
 */

import Anthropic from "@anthropic-ai/sdk";
import { UK_PROFILE_RESEARCH_PROMPT } from "./accountability-personas";
import type { AccountabilityState } from "./accountability-tracker-orchestrator";
import type { UKProfileData, InvestigationSource, SourceType } from "../types/accountability";
import { fetchUKPublicData } from "../services/uk-public-data-service";
import { addInvestigationSource } from "../services/accountability-service";

/**
 * Map source type strings from uk-public-data-service to SourceType
 */
function mapSourceType(sourceType: string): SourceType {
  const mapping: Record<string, SourceType> = {
    companies_house: "companies_house",
    charity_commission: "charity_commission",
    register_of_interests: "register_of_interests",
    electoral_commission: "electoral_commission",
    contracts_finder: "contracts_finder",
  };
  return mapping[sourceType] ?? "other";
}

/**
 * Create a sparse/empty profile when no data is available.
 */
function createSparseProfile(entityName: string): UKProfileData {
  return {
    fullName: entityName,
    aliases: [],
    dateOfBirth: undefined,
    currentPositions: [],
    pastPositions: [],
    companiesHouseEntities: [],
    registerOfInterests: [],
    charityInvolvements: [],
    politicalDonations: [],
    governmentContracts: [],
    sources: [],
    dataCompleteness: {
      hasCompaniesHouse: false,
      hasRegisterOfInterests: false,
      hasCharityData: false,
      hasDonationsData: false,
      hasContractsData: false,
      completenessScore: 0,
    },
  };
}

/**
 * UK Profile Research Agent Node
 *
 * Fetches UK public data from multiple sources and synthesizes
 * it into a structured profile using Claude Opus.
 */
export async function ukProfileResearchNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  const startTime = Date.now();
  const agentName = "uk_profile_research";
  
  state.callbacks?.onAgentStarted?.(agentName);
  state.callbacks?.onStageChanged?.("researching");
  
  console.log(`[UK Profile Research] Researching: "${state.targetEntity}"`);

  const entityType = state.entityType ?? "individual";

  const ukDataResult = await fetchUKPublicData(state.targetEntity, entityType);

  for (const source of ukDataResult.sources) {
    try {
      await addInvestigationSource(state.investigationId, {
        source_type: mapSourceType(source.sourceType),
        url: source.url,
        title: source.title,
        accessed_at: source.accessedAt,
        data_extracted: null,
        verification_status: source.verificationStatus,
      });
    } catch (err) {
      console.warn(`[UK Profile Research] Failed to add source: ${err}`);
    }
  }

  const hasAnyData =
    (ukDataResult.profileData.companiesHouseEntities?.length ?? 0) > 0 ||
    (ukDataResult.profileData.charityInvolvements?.length ?? 0) > 0 ||
    (ukDataResult.profileData.registerOfInterests?.length ?? 0) > 0 ||
    (ukDataResult.profileData.politicalDonations?.length ?? 0) > 0 ||
    (ukDataResult.profileData.governmentContracts?.length ?? 0) > 0;

  if (!hasAnyData) {
    console.log(
      `[UK Profile Research] No data found, returning sparse profile`
    );
    const durationMs = Date.now() - startTime;
    state.callbacks?.onAgentCompleted?.(agentName, durationMs);
    return {
      profileData: createSparseProfile(state.targetEntity),
      completedSteps: ["uk_profile_research"],
    };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const rawDataJson = JSON.stringify(ukDataResult.profileData, null, 2);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${UK_PROFILE_RESEARCH_PROMPT}

Entity Name: "${state.targetEntity}"
Entity Type: ${entityType}

Raw Public Data:
${rawDataJson}`,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(
      `[UK Profile Research] Could not extract JSON, returning sparse profile`
    );
    const durationMs = Date.now() - startTime;
    state.callbacks?.onAgentCompleted?.(agentName, durationMs);
    return {
      profileData: createSparseProfile(state.targetEntity),
      completedSteps: ["uk_profile_research"],
    };
  }

  let profileData: UKProfileData;
  try {
    profileData = JSON.parse(jsonMatch[0]) as UKProfileData;
  } catch {
    console.warn(
      `[UK Profile Research] JSON parse failed, returning sparse profile`
    );
    const durationMs = Date.now() - startTime;
    state.callbacks?.onAgentCompleted?.(agentName, durationMs);
    return {
      profileData: createSparseProfile(state.targetEntity),
      completedSteps: ["uk_profile_research"],
    };
  }

  console.log(
    `[UK Profile Research] Profile synthesized with completeness score: ${profileData.dataCompleteness?.completenessScore ?? 0}`
  );

  const durationMs = Date.now() - startTime;
  state.callbacks?.onAgentCompleted?.(agentName, durationMs);
  
  return {
    profileData,
    completedSteps: ["uk_profile_research"],
  };
}
