/**
 * Corruption Analysis Agent
 *
 * Generates theoretical corruption scenarios with mandatory ethical framing.
 * Uses Claude Sonnet for complex reasoning about structural vulnerabilities.
 */

import Anthropic from "@anthropic-ai/sdk";
import { CORRUPTION_ANALYSIS_PROMPT } from "./accountability-personas";
import type { AccountabilityState } from "./accountability-tracker-orchestrator";
import type { CorruptionScenario, EntityType } from "../types/accountability";
import { parseJsonWithRetry, createStricterPrompt } from "./json-parse-retry";

/**
 * Generate generic scenarios when profile data is sparse or empty.
 */
function generateGenericScenarios(entityType: EntityType): CorruptionScenario[] {
  if (entityType === "organization") {
    return [
      {
        scenarioId: "generic-org-1",
        title: "Potential for Procurement Irregularities",
        description:
          "Organizations could theoretically engage in bid-rigging or preferential contract allocation, particularly if they have relationships with government decision-makers.",
        mechanism:
          "Through relationships with procurement officials, favorable treatment in contract awards could potentially occur.",
        incentiveStructure:
          "Financial incentives exist when organizations stand to benefit from government or large institutional contracts.",
        enablingPositions: ["Company Director", "Procurement Contact"],
        potentialConflicts: [
          {
            description: "Organization might have connections to decision-makers",
            positionA: "Company representative",
            positionB: "Procurement official",
            conflictType: "financial",
          },
        ],
        redFlags: [
          "Unusually high win rate on competitive tenders",
          "Last-minute specification changes favoring one bidder",
          "Relationships between company officials and contracting authorities",
        ],
        innocentExplanations: [
          "High win rate may reflect genuine expertise and competitive pricing",
          "Specification changes may address legitimate technical requirements",
          "Professional relationships are normal in industry contexts",
        ],
        riskLevel: "medium",
        detectionDifficulty: "moderate",
        historicalPrecedents: [
          {
            name: "UK Construction Industry Investigation",
            year: 2009,
            description:
              "OFT investigation into bid-rigging in construction industry",
            outcome: "Fines of £129 million across 103 companies",
            sourceUrl: undefined,
          },
        ],
      },
      {
        scenarioId: "generic-org-2",
        title: "Potential Regulatory Capture",
        description:
          "Organizations could theoretically influence regulatory bodies through lobbying, revolving door employment, or other means.",
        mechanism:
          "By employing former regulators or maintaining close relationships with regulatory bodies, organizations might theoretically receive favorable treatment.",
        incentiveStructure:
          "Regulatory outcomes directly affect profitability and competitive position.",
        enablingPositions: ["Former Regulator", "Industry Lobbyist", "Board Member"],
        potentialConflicts: [
          {
            description: "Former regulator now employed by regulated entity",
            positionA: "Former regulatory official",
            positionB: "Current company employee",
            conflictType: "regulatory",
          },
        ],
        redFlags: [
          "Hiring of former regulators shortly after favorable decisions",
          "Unusual access to regulatory decision-makers",
          "Policy outcomes consistently favoring certain organizations",
        ],
        innocentExplanations: [
          "Former regulators bring valuable expertise to industry",
          "Regular engagement with regulators is normal business practice",
          "Policy outcomes may reflect legitimate industry needs",
        ],
        riskLevel: "medium",
        detectionDifficulty: "difficult",
        historicalPrecedents: [
          {
            name: "Various UK Sector Reviews",
            year: 2018,
            description: "Reviews of revolving door practices across sectors",
            outcome: "Strengthened cooling-off periods for some roles",
            sourceUrl: undefined,
          },
        ],
      },
      {
        scenarioId: "generic-org-3",
        title: "Potential Financial Misreporting",
        description:
          "Organizations could theoretically misrepresent their financial position to investors, regulators, or tax authorities.",
        mechanism:
          "Through complex accounting structures or related-party transactions, true financial positions might be obscured.",
        incentiveStructure:
          "Tax minimization, investor relations, and regulatory compliance create pressures that could theoretically lead to misreporting.",
        enablingPositions: ["CFO", "External Auditor", "Tax Advisor"],
        potentialConflicts: [
          {
            description: "Auditor dependency on client for fees",
            positionA: "External auditor",
            positionB: "Company management",
            conflictType: "financial",
          },
        ],
        redFlags: [
          "Complex corporate structures in low-tax jurisdictions",
          "Unusual related-party transactions",
          "Significant off-balance-sheet arrangements",
        ],
        innocentExplanations: [
          "Complex structures may reflect legitimate business needs",
          "Related-party transactions are often normal business practice",
          "Off-balance-sheet arrangements may be required by accounting standards",
        ],
        riskLevel: "medium",
        detectionDifficulty: "difficult",
        historicalPrecedents: [
          {
            name: "Carillion Collapse",
            year: 2018,
            description:
              "Major UK contractor collapsed amid accounting concerns",
            outcome: "Government inquiry, regulatory reforms proposed",
            sourceUrl: undefined,
          },
        ],
      },
    ];
  }

  // Generic scenarios for individuals
  return [
    {
      scenarioId: "generic-ind-1",
      title: "Potential Undisclosed Conflicts of Interest",
      description:
        "Individuals in public positions could theoretically fail to disclose relevant financial interests that might influence their decisions.",
      mechanism:
        "By holding undisclosed financial interests in entities affected by their decisions, conflicts could theoretically arise.",
      incentiveStructure:
        "Personal financial gain from decisions made in official capacity creates theoretical incentive for non-disclosure.",
      enablingPositions: ["Public Official", "Decision Maker"],
      potentialConflicts: [
        {
          description: "Official decisions may affect personal investments",
          positionA: "Public role",
          positionB: "Private investor",
          conflictType: "financial",
        },
      ],
      redFlags: [
        "Decisions consistently favoring certain entities",
        "Personal connections to benefiting parties",
        "Gaps in disclosure records",
      ],
      innocentExplanations: [
        "Decisions may be based on legitimate policy considerations",
        "Personal connections do not necessarily influence decisions",
        "Disclosure gaps may be administrative oversights",
      ],
      riskLevel: "medium",
      detectionDifficulty: "moderate",
      historicalPrecedents: [
        {
          name: "Various UK Parliamentary Standards Cases",
          year: 2021,
          description: "Standards Committee investigations into declarations",
          outcome: "Guidance strengthened on disclosure requirements",
          sourceUrl: undefined,
        },
      ],
    },
    {
      scenarioId: "generic-ind-2",
      title: "Potential Influence Peddling",
      description:
        "Individuals with public connections could theoretically trade on their access to decision-makers for personal gain.",
      mechanism:
        "By offering access to or influence over public officials, individuals could theoretically receive payments or benefits.",
      incentiveStructure:
        "Valuable access to power creates opportunities that could theoretically be monetized.",
      enablingPositions: ["Former Official", "Political Advisor", "Lobbyist"],
      potentialConflicts: [
        {
          description: "Personal financial interest in outcomes of lobbying",
          positionA: "Lobbyist/Advisor",
          positionB: "Client beneficiary",
          conflictType: "financial",
        },
      ],
      redFlags: [
        "Payments for facilitation of access",
        "Success fees tied to policy outcomes",
        "Unusual patterns of meetings between officials and third parties",
      ],
      innocentExplanations: [
        "Advisory and lobbying services are legitimate professions",
        "Meeting facilitation is normal in political contexts",
        "Success-based compensation is common in consulting",
      ],
      riskLevel: "medium",
      detectionDifficulty: "difficult",
      historicalPrecedents: [
        {
          name: "UK Lobbying Scandals",
          year: 2021,
          description:
            "Various investigations into lobbying practices by former officials",
          outcome: "Calls for strengthened lobbying regulations",
          sourceUrl: undefined,
        },
      ],
    },
    {
      scenarioId: "generic-ind-3",
      title: "Potential Misuse of Public Resources",
      description:
        "Individuals with access to public resources could theoretically misappropriate them for personal benefit.",
      mechanism:
        "Through expense claims, staff usage, or resource allocation, public resources could theoretically be diverted.",
      incentiveStructure:
        "Access to public funds with limited oversight creates theoretical opportunities for misuse.",
      enablingPositions: ["Elected Official", "Senior Civil Servant"],
      potentialConflicts: [
        {
          description: "Personal benefit from public resource allocation",
          positionA: "Resource allocator",
          positionB: "Personal beneficiary",
          conflictType: "financial",
        },
      ],
      redFlags: [
        "Unusual expense patterns",
        "Use of official resources for private purposes",
        "Lack of proper documentation for expenditure",
      ],
      innocentExplanations: [
        "Expense variations may reflect legitimate work requirements",
        "Boundary between official and private use can be genuinely unclear",
        "Documentation gaps may be administrative issues",
      ],
      riskLevel: "low",
      detectionDifficulty: "easy",
      historicalPrecedents: [
        {
          name: "UK MPs' Expenses Scandal",
          year: 2009,
          description:
            "Widespread misuse of parliamentary expenses revealed",
          outcome: "IPSA created, several prosecutions",
          sourceUrl: undefined,
        },
      ],
    },
  ];
}

/**
 * Validate that scenarios have required ethical elements
 */
function validateScenarios(scenarios: CorruptionScenario[]): void {
  for (const scenario of scenarios) {
    if (!scenario.innocentExplanations || scenario.innocentExplanations.length === 0) {
      console.warn(
        `[Corruption Analysis] Scenario "${scenario.scenarioId}" missing innocentExplanations`
      );
    }

    // Check for absolute accusatory language
    const descriptionLower = scenario.description.toLowerCase();
    if (
      descriptionLower.includes("is corrupt") ||
      descriptionLower.includes("has engaged in corruption") ||
      descriptionLower.includes("has committed")
    ) {
      console.warn(
        `[Corruption Analysis] Scenario "${scenario.scenarioId}" uses accusatory language instead of conditional`
      );
    }
  }
}

/**
 * Corruption Analysis Agent Node
 *
 * Generates theoretical corruption scenarios based on profile data.
 * Validates ethical framing and innocent explanations.
 */
export async function corruptionAnalysisNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  const startTime = Date.now();
  const agentName = "corruption_analysis";
  
  state.callbacks?.onAgentStarted?.(agentName);
  state.callbacks?.onStageChanged?.("analyzing");
  
  console.log(
    `[Corruption Analysis] Analyzing potential scenarios for: "${state.targetEntity}"`
  );

  const entityType = state.entityType ?? "individual";
  const profileData = state.profileData;

  // Check if profile data is sparse
  const hasSignificantData =
    profileData &&
    ((profileData.companiesHouseEntities?.length ?? 0) > 0 ||
      (profileData.currentPositions?.length ?? 0) > 0 ||
      (profileData.registerOfInterests?.length ?? 0) > 0 ||
      (profileData.charityInvolvements?.length ?? 0) > 0 ||
      (profileData.politicalDonations?.length ?? 0) > 0 ||
      (profileData.governmentContracts?.length ?? 0) > 0);

  if (!hasSignificantData) {
    console.log(
      `[Corruption Analysis] Sparse profile data, generating generic scenarios`
    );
    const genericScenarios = generateGenericScenarios(entityType);
    const durationMs = Date.now() - startTime;
    state.callbacks?.onAgentCompleted?.(agentName, durationMs);
    return {
      corruptionScenarios: genericScenarios,
      completedSteps: ["corruption_analysis"],
    };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const profileDataJson = JSON.stringify(profileData, null, 2);

  const basePrompt = `${CORRUPTION_ANALYSIS_PROMPT}

Entity Name: "${state.targetEntity}"
Entity Type: ${entityType}

Profile Data:
${profileDataJson}`;

  let scenarios: CorruptionScenario[];
  try {
    scenarios = await parseJsonWithRetry<CorruptionScenario[]>(
      async (isRetry) => {
        const prompt = createStricterPrompt(basePrompt, isRetry);
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          messages: [{ role: "user", content: prompt }],
        });
        return message.content[0].type === "text" ? message.content[0].text : "";
      },
      (text) => text.match(/\[[\s\S]*\]/)?.[0] ?? null,
      { maxRetries: 1, agentName: "Corruption Analysis" }
    );
  } catch {
    console.warn(
      `[Corruption Analysis] JSON parse failed after retries, generating generic scenarios`
    );
    const genericScenarios = generateGenericScenarios(entityType);
    const durationMs = Date.now() - startTime;
    state.callbacks?.onAgentCompleted?.(agentName, durationMs);
    return {
      corruptionScenarios: genericScenarios,
      completedSteps: ["corruption_analysis"],
    };
  }

  // Validate scenarios have required elements
  validateScenarios(scenarios);

  // Ensure each scenario has innocentExplanations
  for (const scenario of scenarios) {
    if (!scenario.innocentExplanations || scenario.innocentExplanations.length === 0) {
      scenario.innocentExplanations = [
        "This pattern may have legitimate explanations not visible in public records",
        "Many similar patterns exist without any wrongdoing",
        "Further investigation would be needed to draw any conclusions",
      ];
    }
  }

  console.log(
    `[Corruption Analysis] Generated ${scenarios.length} theoretical scenarios`
  );

  const durationMs = Date.now() - startTime;
  state.callbacks?.onAgentCompleted?.(agentName, durationMs);
  
  return {
    corruptionScenarios: scenarios,
    completedSteps: ["corruption_analysis"],
  };
}
