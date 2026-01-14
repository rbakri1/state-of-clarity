/**
 * Entity Classification Agent
 *
 * Classifies whether a target entity is an individual or organization.
 * Uses Claude Haiku for cost efficiency.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ENTITY_CLASSIFICATION_PROMPT } from "./accountability-personas";
import type { AccountabilityState } from "./accountability-tracker-orchestrator";
import type { EntityType } from "../types/accountability";

interface ClassificationResponse {
  entityType: EntityType;
  confidence: number;
  reasoning: string;
}

const ORGANIZATION_SUFFIXES = [
  "ltd",
  "limited",
  "plc",
  "llc",
  "inc",
  "corp",
  "corporation",
  "council",
  "trust",
  "foundation",
  "association",
  "group",
  "holdings",
  "partners",
];

function detectOrganizationBySuffix(entityName: string): boolean {
  const lowerName = entityName.toLowerCase().trim();
  for (const suffix of ORGANIZATION_SUFFIXES) {
    if (
      lowerName.endsWith(` ${suffix}`) ||
      lowerName.endsWith(`.${suffix}`) ||
      lowerName === suffix
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Entity Classification Agent Node
 *
 * Classifies the target entity as individual or organization.
 * Checks for common corporate suffixes before calling LLM.
 * Defaults to 'individual' if classification is ambiguous.
 */
export async function entityClassificationNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  console.log(`[Entity Classification] Classifying: "${state.targetEntity}"`);

  if (detectOrganizationBySuffix(state.targetEntity)) {
    console.log(
      `[Entity Classification] Detected organization suffix in name`
    );
    return {
      entityType: "organization",
      completedSteps: ["entity_classification"],
    };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `${ENTITY_CLASSIFICATION_PROMPT}\n\nEntity to classify: "${state.targetEntity}"`,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(
      `[Entity Classification] Could not extract JSON, defaulting to individual`
    );
    return {
      entityType: "individual",
      completedSteps: ["entity_classification"],
    };
  }

  let parsed: ClassificationResponse;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.warn(
      `[Entity Classification] JSON parse failed, defaulting to individual`
    );
    return {
      entityType: "individual",
      completedSteps: ["entity_classification"],
    };
  }

  const entityType: EntityType =
    parsed.entityType === "organization" || parsed.entityType === "individual"
      ? parsed.entityType
      : "individual";

  console.log(
    `[Entity Classification] Result: ${entityType} (confidence: ${parsed.confidence}, reason: ${parsed.reasoning})`
  );

  return {
    entityType,
    completedSteps: ["entity_classification"],
  };
}
