/**
 * Reconciliation Agent
 *
 * Compares Structure and Narrative outputs to identify inconsistencies.
 * Structure is the source of truth - Narrative is adjusted to align.
 * Designed to complete in <10 seconds.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface StructureOutput {
  factors: Array<{
    name: string;
    description: string;
    stakeholders: string[];
    impact: string;
  }>;
  policies: Array<{
    name: string;
    description: string;
    proponents: string[];
    opponents: string[];
    tradeoffs: string;
  }>;
  timeline?: Array<{
    date: string;
    event: string;
    significance: string;
  }>;
}

export interface NarrativeOutput {
  introduction: string;
  mainBody: string;
  conclusion: string;
  keyTakeaways: string[];
}

export interface ReconciliationOutput {
  reconciledNarrative: NarrativeOutput;
  changes: string[];
  isConsistent: boolean;
}

export interface ReconciliationInput {
  structure: StructureOutput;
  narrative: NarrativeOutput;
}

/**
 * Reconciles Structure and Narrative outputs by checking for inconsistencies.
 * Structure is treated as the source of truth.
 *
 * Checks performed:
 * 1. Do all factors in the Narrative appear in the Structure table?
 * 2. Do all policies mentioned align?
 * 3. Are there any contradictory statements?
 *
 * @param input - The structure and narrative outputs to reconcile
 * @returns Reconciled narrative with list of changes made
 */
export async function reconcileOutputs(
  input: ReconciliationInput
): Promise<ReconciliationOutput> {
  const { structure, narrative } = input;

  if (!structure || !narrative) {
    return {
      reconciledNarrative: narrative || {
        introduction: "",
        mainBody: "",
        conclusion: "",
        keyTakeaways: [],
      },
      changes: [],
      isConsistent: true,
    };
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = buildReconciliationPrompt(structure, narrative);

  const message = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(
      "[Reconciliation Agent] Could not parse response, returning original narrative"
    );
    return {
      reconciledNarrative: narrative,
      changes: [],
      isConsistent: true,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ReconciliationOutput;
    return validateReconciliationOutput(parsed, narrative);
  } catch (error) {
    console.warn("[Reconciliation Agent] JSON parse error:", error);
    return {
      reconciledNarrative: narrative,
      changes: [],
      isConsistent: true,
    };
  }
}

function buildReconciliationPrompt(
  structure: StructureOutput,
  narrative: NarrativeOutput
): string {
  const factorNames = structure.factors.map((f) => f.name).join(", ");
  const policyNames = structure.policies.map((p) => p.name).join(", ");

  return `You are a reconciliation agent. Compare these two outputs and identify any inconsistencies.
The STRUCTURE is the source of truth - fix the NARRATIVE if they disagree.

STRUCTURE (Source of Truth):
Factors: ${factorNames}
Policies: ${policyNames}

Full Structure Data:
${JSON.stringify(structure, null, 2)}

NARRATIVE:
${JSON.stringify(narrative, null, 2)}

Perform these consistency checks:
1. Do all factors mentioned in the Narrative appear in the Structure table?
2. Do all policies mentioned in the Narrative align with those in the Structure?
3. Are there any contradictory statements between Structure and Narrative?
4. Does the Narrative accurately represent the stakeholders from the Structure?
5. Are the tradeoffs described consistently?

If inconsistencies exist, provide a corrected narrative that aligns with the Structure.
Make MINIMAL changes - only fix actual inconsistencies, don't rewrite content unnecessarily.

Return a JSON object with this exact structure:
{
  "isConsistent": boolean,
  "changes": ["Description of each change made", "Or empty array if consistent"],
  "reconciledNarrative": {
    "introduction": "The introduction text (modified if needed)",
    "mainBody": "The main body text (modified if needed)",
    "conclusion": "The conclusion text (modified if needed)",
    "keyTakeaways": ["Array of key takeaways (modified if needed)"]
  }
}

If the narrative is already consistent with the structure, set isConsistent to true, 
changes to an empty array, and return the original narrative unchanged in reconciledNarrative.`;
}

function validateReconciliationOutput(
  parsed: ReconciliationOutput,
  originalNarrative: NarrativeOutput
): ReconciliationOutput {
  if (!parsed.reconciledNarrative) {
    return {
      reconciledNarrative: originalNarrative,
      changes: parsed.changes || [],
      isConsistent: parsed.isConsistent ?? true,
    };
  }

  const reconciledNarrative: NarrativeOutput = {
    introduction:
      parsed.reconciledNarrative.introduction || originalNarrative.introduction,
    mainBody: parsed.reconciledNarrative.mainBody || originalNarrative.mainBody,
    conclusion:
      parsed.reconciledNarrative.conclusion || originalNarrative.conclusion,
    keyTakeaways: Array.isArray(parsed.reconciledNarrative.keyTakeaways)
      ? parsed.reconciledNarrative.keyTakeaways
      : originalNarrative.keyTakeaways,
  };

  return {
    reconciledNarrative,
    changes: Array.isArray(parsed.changes) ? parsed.changes : [],
    isConsistent:
      typeof parsed.isConsistent === "boolean" ? parsed.isConsistent : true,
  };
}
