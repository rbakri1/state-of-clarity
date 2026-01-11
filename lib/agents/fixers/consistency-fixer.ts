/**
 * Internal Consistency Fixer
 *
 * Analyzes briefs for contradictions between sections and suggests
 * improvements to maintain coherent messaging throughout the document.
 */

import { BaseFixer } from "./base-fixer";
import { FixerType, FixerInput } from "@/lib/types/refinement";

export class ConsistencyFixer extends BaseFixer {
  readonly fixerType = FixerType.internalConsistency;
  readonly description =
    "resolving contradictions and ensuring internal consistency";

  protected buildPrompt(input: FixerInput): string {
    const { brief, dimensionScore, critique } = input;

    return `Analyze this brief for internal consistency issues. The current score for this dimension is ${dimensionScore}/10.

${critique ? `Evaluator critique: "${critique}"` : ""}

## Brief Content:
${brief}

## Your Task:
Identify and suggest fixes for internal consistency problems:

1. **Contradictions Between Sections**: Find places where different parts of the brief make conflicting claims. For example:
   - The introduction says X, but the conclusion implies not-X
   - Data in one section contradicts claims in another
   - Key arguments that undermine each other

2. **Source Support Resolution**: When contradictions exist, determine which version to keep based on:
   - Which claim has stronger source support
   - Which aligns better with the overall argument
   - Which is more recent or authoritative

3. **Terminology Consistency**: Ensure key terms are used consistently:
   - Same concept should use same terminology throughout
   - Definitions should not shift or expand mid-document
   - Acronyms and abbreviations should be consistent

4. **Narrative Coherence**: Ensure the story flows logically:
   - Claims made early should be supported later (not contradicted)
   - Summaries should accurately reflect the detailed sections
   - The tone and framing should remain consistent

Focus on the MOST impactful contradictions that undermine the brief's credibility. Suggest specific text modifications to resolve each inconsistency, clearly indicating which version should be kept and why.

Remember: A brief with internal contradictions loses reader trust. All sections should tell the same coherent story.`;
  }
}
