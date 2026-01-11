/**
 * Edit Reconciliation Agent
 *
 * Merges suggested edits from multiple fixer agents into a coherent revised brief.
 * Resolves conflicts when multiple fixers suggest edits to the same section.
 * Uses Claude Sonnet for high-quality reconciliation.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  SuggestedEdit,
  ReconciliationResult,
  FixerType,
  FixerResult,
} from "@/lib/types/refinement";

const SONNET_MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Input for the reconciliation agent
 */
export interface ReconciliationInput {
  originalBrief: string;
  fixerResults: FixerResult[];
}

/**
 * Priority weights for edit prioritization
 */
const PRIORITY_WEIGHTS: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[EditReconciliation] Attempt ${attempt}/${retries} failed: ${lastError.message}`
      );

      if (attempt < retries) {
        const backoffMs = delayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError;
}

/**
 * Group edits by section to identify potential conflicts
 */
function groupEditsBySection(
  fixerResults: FixerResult[]
): Map<string, Array<{ edit: SuggestedEdit; fixerType: FixerType }>> {
  const editsBySection = new Map<
    string,
    Array<{ edit: SuggestedEdit; fixerType: FixerType }>
  >();

  for (const result of fixerResults) {
    for (const edit of result.suggestedEdits) {
      const section = edit.section.toLowerCase().trim();
      if (!editsBySection.has(section)) {
        editsBySection.set(section, []);
      }
      editsBySection.get(section)!.push({
        edit,
        fixerType: result.fixerType,
      });
    }
  }

  return editsBySection;
}

/**
 * Calculate a priority score for an edit based on priority, fixer agreement, and clarity impact
 */
function calculateEditScore(
  edit: SuggestedEdit,
  fixerAgreementCount: number
): number {
  const priorityScore = PRIORITY_WEIGHTS[edit.priority] || 2;
  const agreementBonus = fixerAgreementCount > 1 ? fixerAgreementCount * 0.5 : 0;
  return priorityScore + agreementBonus;
}

/**
 * Detect if two edits conflict (target overlapping text)
 */
function editsConflict(edit1: SuggestedEdit, edit2: SuggestedEdit): boolean {
  const text1 = edit1.originalText.toLowerCase();
  const text2 = edit2.originalText.toLowerCase();
  return text1.includes(text2) || text2.includes(text1) || text1 === text2;
}

/**
 * Prioritize and select non-conflicting edits
 */
function prioritizeEdits(
  editsBySection: Map<string, Array<{ edit: SuggestedEdit; fixerType: FixerType }>>
): {
  selectedEdits: Array<{ edit: SuggestedEdit; fixerType: FixerType; score: number }>;
  skippedEdits: Array<{ edit: SuggestedEdit; reason: string }>;
} {
  const selectedEdits: Array<{
    edit: SuggestedEdit;
    fixerType: FixerType;
    score: number;
  }> = [];
  const skippedEdits: Array<{ edit: SuggestedEdit; reason: string }> = [];

  for (const [section, edits] of editsBySection) {
    // Calculate scores for all edits in this section
    const scoredEdits = edits.map(({ edit, fixerType }) => {
      // Count how many fixers suggest similar edits (agreement)
      const agreementCount = edits.filter(
        (e) =>
          e.edit.originalText === edit.originalText &&
          e.fixerType !== fixerType
      ).length;
      const score = calculateEditScore(edit, agreementCount + 1);
      return { edit, fixerType, score };
    });

    // Sort by score (highest first)
    scoredEdits.sort((a, b) => b.score - a.score);

    // Select non-conflicting edits
    const sectionSelected: Array<{
      edit: SuggestedEdit;
      fixerType: FixerType;
      score: number;
    }> = [];

    for (const scoredEdit of scoredEdits) {
      // Check if this edit conflicts with any already selected edit
      const hasConflict = sectionSelected.some(({ edit: selected }) =>
        editsConflict(scoredEdit.edit, selected)
      );

      if (hasConflict) {
        skippedEdits.push({
          edit: scoredEdit.edit,
          reason: `Conflicts with higher-priority edit in section "${section}"`,
        });
      } else {
        sectionSelected.push(scoredEdit);
      }
    }

    selectedEdits.push(...sectionSelected);
  }

  return { selectedEdits, skippedEdits };
}

/**
 * Build the reconciliation prompt for Claude
 */
function buildReconciliationPrompt(
  originalBrief: string,
  selectedEdits: Array<{ edit: SuggestedEdit; fixerType: FixerType; score: number }>
): string {
  const editsDescription = selectedEdits
    .map(
      ({ edit, fixerType }, index) =>
        `Edit ${index + 1} (from ${fixerType}, priority: ${edit.priority}):
  Section: ${edit.section}
  Original: "${edit.originalText}"
  Suggested: "${edit.suggestedText}"
  Rationale: ${edit.rationale}`
    )
    .join("\n\n");

  return `You are a skilled editor tasked with applying a set of suggested edits to a brief while maintaining narrative coherence.

## Original Brief

${originalBrief}

## Suggested Edits to Apply

${editsDescription}

## Instructions

1. Apply all the suggested edits to the original brief
2. Ensure the revised text flows naturally - adjust transitions if needed
3. Maintain consistent tone and style throughout
4. Do not add new information or change meaning beyond what the edits specify
5. If an edit's originalText cannot be found exactly in the brief, skip it

## Response Format

Respond with valid JSON only:

{
  "revisedBrief": "The complete revised brief with all applicable edits applied",
  "editsApplied": [
    {
      "section": "section name",
      "originalText": "original text that was replaced",
      "suggestedText": "the replacement text",
      "rationale": "why this edit was made",
      "priority": "critical|high|medium|low"
    }
  ],
  "editsNotApplicable": [
    {
      "section": "section name",
      "originalText": "text that could not be found",
      "reason": "why this edit could not be applied"
    }
  ]
}`;
}

/**
 * Parse the reconciliation response from Claude
 */
function parseReconciliationResponse(
  response: string,
  selectedEdits: Array<{ edit: SuggestedEdit; fixerType: FixerType; score: number }>,
  alreadySkipped: Array<{ edit: SuggestedEdit; reason: string }>
): ReconciliationResult {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn("[EditReconciliation] Could not extract JSON from response");
    return {
      revisedBrief: "",
      editsApplied: [],
      editsSkipped: alreadySkipped,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const revisedBrief = String(parsed.revisedBrief || "");

    // Parse edits that were actually applied
    const editsApplied: SuggestedEdit[] = (parsed.editsApplied || []).map(
      (edit: {
        section: string;
        originalText: string;
        suggestedText: string;
        rationale: string;
        priority: string;
      }) => ({
        section: String(edit.section || ""),
        originalText: String(edit.originalText || ""),
        suggestedText: String(edit.suggestedText || ""),
        rationale: String(edit.rationale || ""),
        priority: validatePriority(edit.priority),
      })
    );

    // Collect skipped edits from reconciliation process
    const reconciliationSkipped: Array<{ edit: SuggestedEdit; reason: string }> =
      (parsed.editsNotApplicable || []).map(
        (item: { section: string; originalText: string; reason: string }) => {
          // Find the original edit
          const originalEdit = selectedEdits.find(
            (se) =>
              se.edit.section.toLowerCase() === (item.section || "").toLowerCase() &&
              se.edit.originalText === item.originalText
          );
          return {
            edit: originalEdit?.edit || {
              section: item.section || "",
              originalText: item.originalText || "",
              suggestedText: "",
              rationale: "",
              priority: "medium" as const,
            },
            reason: String(item.reason || "Could not be applied"),
          };
        }
      );

    return {
      revisedBrief,
      editsApplied,
      editsSkipped: [...alreadySkipped, ...reconciliationSkipped],
    };
  } catch (error) {
    console.warn("[EditReconciliation] Failed to parse JSON response:", error);
    return {
      revisedBrief: "",
      editsApplied: [],
      editsSkipped: alreadySkipped,
    };
  }
}

/**
 * Validate priority value
 */
function validatePriority(
  priority: string
): "critical" | "high" | "medium" | "low" {
  const validPriorities = ["critical", "high", "medium", "low"];
  if (validPriorities.includes(priority)) {
    return priority as "critical" | "high" | "medium" | "low";
  }
  return "medium";
}

/**
 * Main reconciliation function
 */
export async function reconcileEdits(
  input: ReconciliationInput
): Promise<ReconciliationResult> {
  const startTime = Date.now();
  const { originalBrief, fixerResults } = input;

  // Count total suggested edits
  const totalEdits = fixerResults.reduce(
    (sum, r) => sum + r.suggestedEdits.length,
    0
  );

  console.log(
    `[EditReconciliation] Starting reconciliation with ${totalEdits} suggested edits from ${fixerResults.length} fixers`
  );

  // If no edits, return original brief
  if (totalEdits === 0) {
    console.log("[EditReconciliation] No edits to apply");
    return {
      revisedBrief: originalBrief,
      editsApplied: [],
      editsSkipped: [],
    };
  }

  // Group edits by section
  const editsBySection = groupEditsBySection(fixerResults);
  console.log(
    `[EditReconciliation] Edits grouped into ${editsBySection.size} sections`
  );

  // Prioritize and select non-conflicting edits
  const { selectedEdits, skippedEdits } = prioritizeEdits(editsBySection);
  console.log(
    `[EditReconciliation] Selected ${selectedEdits.length} edits, skipped ${skippedEdits.length} due to conflicts`
  );

  // If no edits selected after conflict resolution, return original
  if (selectedEdits.length === 0) {
    console.log("[EditReconciliation] No edits selected after conflict resolution");
    return {
      revisedBrief: originalBrief,
      editsApplied: [],
      editsSkipped: skippedEdits,
    };
  }

  // Build prompt and call Claude Sonnet
  const prompt = buildReconciliationPrompt(originalBrief, selectedEdits);

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const result = await withRetry(async () => {
    const message = await anthropic.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8000,
      system: `You are an expert editor who applies suggested edits to documents while maintaining narrative coherence and flow. You respond only with valid JSON.`,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";
    return parseReconciliationResponse(responseText, selectedEdits, skippedEdits);
  });

  const processingTime = Date.now() - startTime;
  console.log(
    `[EditReconciliation] Completed in ${processingTime}ms: ${result.editsApplied.length} applied, ${result.editsSkipped.length} skipped`
  );

  return result;
}
