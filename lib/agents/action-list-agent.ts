/**
 * Action List Generation Agent
 *
 * Generates prioritized investigation action items using legal and ethical methods only.
 * Uses Claude Sonnet for reasoning about appropriate investigative approaches.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ACTION_LIST_GENERATION_PROMPT } from "./accountability-personas";
import type { AccountabilityState } from "./accountability-tracker-orchestrator";
import type { ActionItem, ActionPriority, CorruptionScenario } from "../types/accountability";
import { parseJsonWithRetry, createStricterPrompt } from "./json-parse-retry";

const BANNED_WORDS = ["hack", "bribe", "stalk", "harass", "threaten"];

/**
 * Generate default action items when profile/scenarios are sparse
 */
function generateDefaultActionItems(
  scenarioIds: string[]
): ActionItem[] {
  return [
    {
      actionId: "default-1",
      priority: 1,
      action: "Search Companies House for all directorships, shareholdings, and PSC (Persons with Significant Control) records",
      rationale: "Companies House provides verified corporate data accessible to the public",
      dataSource: "Companies House (beta.companieshouse.gov.uk)",
      expectedEvidence: "Full list of corporate relationships, appointment dates, and company statuses",
      estimatedTime: "1-2 hours",
      legalConsiderations: ["All data is public and freely accessible"],
      relatedScenarios: scenarioIds.slice(0, 1),
    },
    {
      actionId: "default-2",
      priority: 1,
      action: "Submit Freedom of Information request to relevant government departments for correspondence and meeting logs",
      rationale: "FOI requests can reveal communications between officials and private interests",
      dataSource: "FOI requests via WhatDoTheyKnow or direct to departments",
      expectedEvidence: "Meeting schedules, correspondence, briefing documents",
      estimatedTime: "20 working days (statutory deadline)",
      legalConsiderations: ["Subject to exemptions under FOIA 2000", "May require internal review or ICO appeal"],
      relatedScenarios: scenarioIds.slice(0, 2),
    },
    {
      actionId: "default-3",
      priority: 1,
      action: "Search Parliament's Register of Members' Interests for declared interests and donations",
      rationale: "MPs must declare financial interests that could influence their parliamentary work",
      dataSource: "Parliament UK (parliament.uk/mps-lords-and-offices/standards-and-interests/)",
      expectedEvidence: "Declared shareholdings, donations, gifts, employment, property",
      estimatedTime: "30 minutes",
      legalConsiderations: ["Public information - no restrictions"],
      relatedScenarios: scenarioIds.slice(0, 1),
    },
    {
      actionId: "default-4",
      priority: 2,
      action: "Search Electoral Commission database for political donations made and received",
      rationale: "Donations over £500 must be reported and may reveal financial relationships",
      dataSource: "Electoral Commission (search.electoralcommission.org.uk)",
      expectedEvidence: "Donation amounts, dates, donor/recipient identities",
      estimatedTime: "1 hour",
      legalConsiderations: ["Public register - freely accessible"],
      relatedScenarios: scenarioIds,
    },
    {
      actionId: "default-5",
      priority: 2,
      action: "Search Land Registry for property ownership records",
      rationale: "Property holdings may reveal undisclosed wealth or connections",
      dataSource: "HM Land Registry (gov.uk/search-property-information-land-registry)",
      expectedEvidence: "Property ownership, purchase dates, mortgage details",
      estimatedTime: "2-3 hours",
      legalConsiderations: ["£3 fee per title search", "Some records restricted"],
      relatedScenarios: scenarioIds.slice(1, 3),
    },
    {
      actionId: "default-6",
      priority: 2,
      action: "Search Contracts Finder for government contracts awarded to related entities",
      rationale: "Government contracts may reveal preferential treatment or conflicts of interest",
      dataSource: "Contracts Finder (gov.uk/contracts-finder)",
      expectedEvidence: "Contract values, award dates, contracting authorities, suppliers",
      estimatedTime: "2 hours",
      legalConsiderations: ["Public database - freely accessible"],
      relatedScenarios: scenarioIds,
    },
    {
      actionId: "default-7",
      priority: 2,
      action: "Search Charity Commission for trustee positions and charity financials",
      rationale: "Charity involvement may reveal undisclosed interests or fund flows",
      dataSource: "Charity Commission (register-of-charities.charitycommission.gov.uk)",
      expectedEvidence: "Trustee appointments, charity accounts, related party transactions",
      estimatedTime: "1-2 hours",
      legalConsiderations: ["Public register - freely accessible"],
      relatedScenarios: scenarioIds.slice(0, 2),
    },
    {
      actionId: "default-8",
      priority: 3,
      action: "Search Hansard and committee records for parliamentary statements and voting patterns",
      rationale: "Parliamentary record may reveal positions taken that align with private interests",
      dataSource: "Hansard (hansard.parliament.uk) and Committee publications",
      expectedEvidence: "Speeches, questions, voting records, committee attendance",
      estimatedTime: "4-6 hours",
      legalConsiderations: ["Public parliamentary record"],
      relatedScenarios: scenarioIds,
    },
    {
      actionId: "default-9",
      priority: 3,
      action: "Search court records and legal databases for litigation history",
      rationale: "Court cases may reveal disputes, settlements, or legal issues",
      dataSource: "Courts and Tribunals Judiciary, BAILII",
      expectedEvidence: "Case details, judgments, parties involved",
      estimatedTime: "3-4 hours",
      legalConsiderations: ["Some family/private cases restricted"],
      relatedScenarios: scenarioIds.slice(1),
    },
    {
      actionId: "default-10",
      priority: 3,
      action: "Search international corporate registries for overseas business interests",
      rationale: "Offshore structures may be used to obscure beneficial ownership",
      dataSource: "OpenCorporates, ICIJ Offshore Leaks Database",
      expectedEvidence: "Foreign company registrations, cross-border relationships",
      estimatedTime: "2-3 hours",
      legalConsiderations: ["Public databases - coverage varies by jurisdiction"],
      relatedScenarios: scenarioIds,
    },
  ];
}

/**
 * Validate that action items don't contain banned words (illegal methods)
 */
function validateActionItems(items: ActionItem[]): void {
  for (const item of items) {
    const actionLower = item.action.toLowerCase();
    const rationaleLower = item.rationale.toLowerCase();
    
    for (const bannedWord of BANNED_WORDS) {
      if (actionLower.includes(bannedWord) || rationaleLower.includes(bannedWord)) {
        console.warn(
          `[Action List] Action "${item.actionId}" contains banned word "${bannedWord}" - filtering out`
        );
        item.action = "[REMOVED - Invalid method suggested]";
        item.rationale = "This action was removed as it suggested inappropriate methods";
      }
    }
  }
}

/**
 * Validate that priorities are balanced (not all priority 1)
 */
function validatePriorityBalance(items: ActionItem[]): void {
  const priorityCounts = { 1: 0, 2: 0, 3: 0 };
  
  for (const item of items) {
    if (item.priority >= 1 && item.priority <= 3) {
      priorityCounts[item.priority as 1 | 2 | 3]++;
    }
  }
  
  const total = items.length;
  const p1Ratio = priorityCounts[1] / total;
  
  if (p1Ratio > 0.6) {
    console.warn(
      `[Action List] Priorities are unbalanced: ${priorityCounts[1]}/${total} are priority 1`
    );
  }
}

/**
 * Ensure each action item has relatedScenarios field
 */
function ensureRelatedScenarios(
  items: ActionItem[],
  scenarios: CorruptionScenario[]
): void {
  const scenarioIds = scenarios.map((s) => s.scenarioId);
  
  for (const item of items) {
    if (!item.relatedScenarios || item.relatedScenarios.length === 0) {
      item.relatedScenarios = scenarioIds.length > 0 ? [scenarioIds[0]] : [];
    }
  }
}

/**
 * Action List Generation Agent Node
 *
 * Generates prioritized investigation action items based on profile data
 * and corruption scenarios. Validates for legal/ethical methods only.
 */
export async function actionListGenerationNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  const startTime = Date.now();
  const agentName = "action_list_generation";
  
  state.callbacks?.onAgentStarted?.(agentName);
  state.callbacks?.onStageChanged?.("generating");
  
  console.log(
    `[Action List] Generating investigation actions for: "${state.targetEntity}"`
  );

  const profileData = state.profileData;
  const corruptionScenarios = state.corruptionScenarios ?? [];
  const scenarioIds = corruptionScenarios.map((s) => s.scenarioId);

  const hasData =
    profileData &&
    ((profileData.companiesHouseEntities?.length ?? 0) > 0 ||
      (profileData.currentPositions?.length ?? 0) > 0 ||
      (profileData.registerOfInterests?.length ?? 0) > 0);

  if (!hasData || corruptionScenarios.length === 0) {
    console.log(
      `[Action List] Sparse data available, generating default action items`
    );
    const defaultItems = generateDefaultActionItems(
      scenarioIds.length > 0 ? scenarioIds : ["generic-1", "generic-2", "generic-3"]
    );
    const durationMs = Date.now() - startTime;
    state.callbacks?.onAgentCompleted?.(agentName, durationMs);
    return {
      actionItems: defaultItems,
      completedSteps: ["action_list_generation"],
    };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const profileDataJson = JSON.stringify(profileData, null, 2);
  const scenariosJson = JSON.stringify(corruptionScenarios, null, 2);

  const basePrompt = `${ACTION_LIST_GENERATION_PROMPT}

Entity Name: "${state.targetEntity}"

Profile Data:
${profileDataJson}

Corruption Scenarios:
${scenariosJson}`;

  let actionItems: ActionItem[];
  try {
    actionItems = await parseJsonWithRetry<ActionItem[]>(
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
      { maxRetries: 1, agentName: "Action List" }
    );
  } catch {
    console.warn(
      `[Action List] JSON parse failed after retries, generating default action items`
    );
    const defaultItems = generateDefaultActionItems(scenarioIds);
    const durationMs = Date.now() - startTime;
    state.callbacks?.onAgentCompleted?.(agentName, durationMs);
    return {
      actionItems: defaultItems,
      completedSteps: ["action_list_generation"],
    };
  }

  validateActionItems(actionItems);
  validatePriorityBalance(actionItems);
  ensureRelatedScenarios(actionItems, corruptionScenarios);

  const validItems = actionItems.filter(
    (item) => !item.action.includes("[REMOVED")
  );

  if (validItems.length < 8) {
    console.log(
      `[Action List] Only ${validItems.length} valid items, supplementing with defaults`
    );
    const defaultItems = generateDefaultActionItems(scenarioIds);
    const neededCount = 8 - validItems.length;
    const supplementItems = defaultItems
      .filter((d) => !validItems.some((v) => v.actionId === d.actionId))
      .slice(0, neededCount);
    validItems.push(...supplementItems);
  }

  console.log(
    `[Action List] Generated ${validItems.length} investigation action items`
  );

  const durationMs = Date.now() - startTime;
  state.callbacks?.onAgentCompleted?.(agentName, durationMs);
  
  return {
    actionItems: validItems,
    completedSteps: ["action_list_generation"],
  };
}
