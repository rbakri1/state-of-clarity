/**
 * Factual Accuracy Fixer
 *
 * Analyzes briefs for factual accuracy issues.
 * Identifies specific factual claims, cross-references against sources,
 * flags unsupported claims, and suggests corrections or hedging language.
 */

import { BaseFixer } from "./base-fixer";
import { FixerType, FixerInput } from "@/lib/types/refinement";

export class FactualAccuracyFixer extends BaseFixer {
  readonly fixerType = FixerType.factualAccuracy;
  readonly description =
    "verifying and correcting factual claims against provided sources";

  protected buildPrompt(input: FixerInput): string {
    const { brief, dimensionScore, critique } = input;

    return `Analyze this brief for factual accuracy issues. The current score for this dimension is ${dimensionScore}/10.

${critique ? `Evaluator critique: "${critique}"` : ""}

## Brief Content:
${brief}

## Your Task:
Identify and suggest fixes for factual accuracy problems:

1. **Specific Factual Claims**: Identify concrete claims that can be verified:
   - Statistics, numbers, percentages, and dates
   - Named events, people, organizations, or places
   - Cause-and-effect statements
   - Historical facts or scientific claims

2. **Cross-Reference Against Sources**: Check if claims match the provided sources:
   - Claims that contradict what the source actually says
   - Numbers or statistics that differ from the source
   - Misattributed quotes or statements
   - Inaccurate paraphrasing of source material

3. **Unsupported Claims**: Flag claims not backed by any provided source:
   - Assertions presented as facts without evidence
   - Claims that go beyond what sources actually state
   - Conclusions that aren't logically derivable from cited evidence
   - Generalizations that overreach from limited data

4. **Suggest Corrections or Hedging**: For problematic claims, recommend:
   - Corrected facts when the accurate information is available
   - Hedging language ("according to...", "some research suggests...")
   - Qualification of certainty ("may", "could", "in some cases")
   - Removal of unsupportable claims

Focus on the MOST significant factual issues that could undermine the brief's credibility. Prioritize:
- Errors that fundamentally change the meaning
- Claims central to the brief's argument
- Easily verifiable facts that are wrong

Remember: Factual accuracy is foundational to credibility. Even minor inaccuracies can erode trust in the entire brief.`;
  }
}
