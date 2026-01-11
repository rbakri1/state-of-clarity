/**
 * Objectivity Fixer
 *
 * Analyzes briefs for balance and perspective representation.
 * Identifies underrepresented perspectives, missing counterarguments,
 * and one-sided framing that needs revision.
 */

import { BaseFixer } from "./base-fixer";
import { FixerType, FixerInput } from "@/lib/types/refinement";

export class ObjectivityFixer extends BaseFixer {
  readonly fixerType = FixerType.objectivity;
  readonly description =
    "improving balance, perspective representation, and fair treatment of viewpoints";

  protected buildPrompt(input: FixerInput): string {
    const { brief, dimensionScore, critique } = input;

    return `Analyze this brief for objectivity and balance issues. The current score for this dimension is ${dimensionScore}/10.

${critique ? `Evaluator critique: "${critique}"` : ""}

## Brief Content:
${brief}

## Your Task:
Identify and suggest fixes for objectivity problems:

1. **Underrepresented Perspectives**: Find viewpoints that are missing or inadequately covered:
   - Stakeholder groups whose concerns are not addressed
   - Alternative interpretations of the evidence
   - Dissenting expert opinions on the topic
   - Historical or cultural perspectives that add context
   - Suggest where and how to include these perspectives

2. **Missing Counterarguments**: Identify where the brief fails to acknowledge opposing views:
   - Arguments against the main thesis that are not addressed
   - Limitations or weaknesses of the presented position
   - Valid criticisms from credible sources
   - Edge cases or exceptions to generalizations
   - Suggest specific counterarguments to include

3. **One-Sided Framing**: Detect presentation that unfairly favors one position:
   - Asymmetric treatment (strong evidence for one side, weak for another)
   - Cherry-picking data that supports a preferred conclusion
   - Dismissive language toward alternative viewpoints
   - Framing that presupposes a particular conclusion
   - Suggest neutral framing alternatives

4. **Balance and Proportion**: Ensure fair allocation of space and emphasis:
   - Topics given disproportionate coverage
   - Key perspectives relegated to footnotes or asides
   - Dominant narratives that crowd out alternatives
   - Suggest rebalancing of content distribution

Focus on the MOST significant objectivity issues that undermine the brief's credibility. Suggest specific edits that:
- Add missing perspectives with appropriate context
- Include counterarguments fairly and substantively
- Reframe one-sided language to be more neutral
- Redistribute emphasis for better balance

Remember: A credible brief presents multiple perspectives fairly, even when reaching a conclusion. The goal is informed understanding, not persuasion.`;
  }
}
