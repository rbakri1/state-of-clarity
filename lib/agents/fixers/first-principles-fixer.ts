/**
 * First-Principles Coherence Fixer
 *
 * Analyzes briefs for gaps in logical reasoning chains and suggests
 * improvements to make first-principles thinking more explicit.
 */

import { BaseFixer } from "./base-fixer";
import { FixerType, FixerInput } from "@/lib/types/refinement";

export class FirstPrinciplesFixer extends BaseFixer {
  readonly fixerType = FixerType.firstPrinciplesCoherence;
  readonly description =
    "improving logical coherence and first-principles reasoning";

  protected buildPrompt(input: FixerInput): string {
    const { brief, dimensionScore, critique } = input;

    return `Analyze this brief for first-principles coherence issues. The current score for this dimension is ${dimensionScore}/10.

${critique ? `Evaluator critique: "${critique}"` : ""}

## Brief Content:
${brief}

## Your Task:
Identify and suggest fixes for issues related to first-principles reasoning:

1. **Gaps in Logical Chain**: Find places where the argument jumps from A to C without explaining B. The reader should be able to follow the logical progression from foundational assumptions to conclusions.

2. **Unstated Assumptions**: Identify assumptions that are taken for granted but should be made explicit. These might include:
   - Causal relationships assumed but not justified
   - Definitions that could be interpreted differently
   - Premises that some readers might not share

3. **Incomplete Reasoning**: Flag conclusions that need stronger supporting logic or intermediate steps to be convincing.

4. **Foundation Clarity**: Ensure the fundamental premises are clearly stated at the outset.

Focus on the MOST impactful improvements that would make the reasoning chain more explicit and easier to follow. Suggest specific text additions or modifications.

Remember: First-principles thinking means breaking down complex problems into basic elements and reasoning up from there. The brief should show this work.`;
  }
}
