/**
 * Bias Detection Fixer
 *
 * Analyzes briefs for subtle framing bias and loaded language.
 * Identifies loaded language, selective emphasis, and framing that
 * favors one position, suggesting neutral alternatives.
 */

import { BaseFixer } from "./base-fixer";
import { FixerType, FixerInput } from "@/lib/types/refinement";

export class BiasFixer extends BaseFixer {
  readonly fixerType = FixerType.biasDetection;
  readonly description =
    "neutralizing subtle framing bias, loaded language, and selective emphasis";

  protected buildPrompt(input: FixerInput): string {
    const { brief, dimensionScore, critique } = input;

    return `Analyze this brief for subtle bias and loaded language. The current score for this dimension is ${dimensionScore}/10.

${critique ? `Evaluator critique: "${critique}"` : ""}

## Brief Content:
${brief}

## Your Task:
Identify and suggest fixes for bias-related problems:

1. **Loaded Language**: Identify emotionally charged or prejudicial word choices:
   - Words with strong positive/negative connotations that influence perception
   - Euphemisms or dysphemisms that soften or harden descriptions
   - Adjectives and adverbs that editorialize rather than describe
   - Metaphors or analogies that carry implicit judgments
   - Suggest neutral alternatives that preserve meaning without bias

2. **Selective Emphasis**: Detect unfair highlighting or burying of information:
   - Key facts relegated to subordinate clauses or footnotes
   - Counterarguments mentioned briefly then dismissed
   - Headline/topic sentences that overstate or understate
   - Information ordering that buries inconvenient facts
   - Suggest restructuring for fair emphasis

3. **Framing Bias**: Identify presentation that subtly favors one position:
   - Problem framing that presupposes particular solutions
   - Anchoring effects from how numbers/statistics are presented
   - False equivalence or false balance in presenting sides
   - Default assumptions embedded in how questions are posed
   - Suggest reframing that allows fair evaluation

4. **Attribution and Sourcing Bias**: Detect bias in how sources are presented:
   - Favorable sources described with credibility markers, unfavorable without
   - Selective quotation that misrepresents source positions
   - Passive voice to obscure agency for negative actions
   - Active voice to emphasize agency for positive actions
   - Suggest balanced attribution language

Focus on the MOST significant bias issues that undermine the brief's neutrality. Suggest specific edits that:
- Replace loaded language with neutral alternatives
- Restructure for fair emphasis of all perspectives
- Reframe to remove implicit positioning
- Balance attribution and sourcing language

Remember: Bias can be subtle and unintentional. The goal is factual, neutral presentation that allows readers to form their own judgments.`;
  }
}
