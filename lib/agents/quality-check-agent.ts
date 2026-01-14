/**
 * Quality Check Agent
 *
 * Calculates quality score and persists investigation results to the database.
 * Final agent in the accountability investigation pipeline.
 */

import {
  calculateQualityScore,
  updateInvestigationResults,
  getInvestigationSources,
} from "../services/accountability-service";
import type { AccountabilityState } from "./accountability-tracker-orchestrator";

/**
 * Quality Check Agent Node
 *
 * Calculates quality score based on data completeness and
 * persists all investigation results to the database.
 */
export async function qualityCheckNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  console.log(
    `[Quality Check] Calculating quality score for investigation: "${state.investigationId}"`
  );

  const profileData = state.profileData;
  const corruptionScenarios = state.corruptionScenarios ?? [];
  const actionItems = state.actionItems ?? [];

  const sources = await getInvestigationSources(state.investigationId);
  const dataSourcesCount = sources.length;

  const { score, notes } = calculateQualityScore({
    profile_data: profileData ?? {
      fullName: state.targetEntity,
      aliases: [],
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
    },
    corruption_scenarios: corruptionScenarios,
    data_sources_count: dataSourcesCount,
  });

  const passed = score >= 6.0;
  console.log(`[Quality Check] Quality gate ${passed ? "passed" : "failed"}: score ${score}`);

  await updateInvestigationResults(state.investigationId, {
    profile_data: profileData ?? undefined,
    corruption_scenarios: corruptionScenarios,
    action_items: actionItems,
    quality_score: score,
    quality_notes: notes,
    data_sources_count: dataSourcesCount,
  });

  console.log(
    `[Quality Check] Persisted investigation results to database`
  );

  return {
    qualityScore: score,
    qualityNotes: notes,
    completedSteps: ["quality_check"],
  };
}
