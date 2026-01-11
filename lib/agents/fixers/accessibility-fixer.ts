/**
 * Accessibility Fixer
 *
 * Analyzes briefs for clarity and readability issues.
 * Identifies jargon, overly complex sentences, and ensures
 * reading level matches target audience.
 */

import { BaseFixer } from "./base-fixer";
import { FixerType, FixerInput } from "@/lib/types/refinement";

export class AccessibilityFixer extends BaseFixer {
  readonly fixerType = FixerType.accessibility;
  readonly description =
    "improving clarity, readability, and plain-language accessibility";

  protected buildPrompt(input: FixerInput): string {
    const { brief, dimensionScore, critique } = input;

    return `Analyze this brief for accessibility and readability issues. The current score for this dimension is ${dimensionScore}/10.

${critique ? `Evaluator critique: "${critique}"` : ""}

## Brief Content:
${brief}

## Your Task:
Identify and suggest fixes for accessibility problems:

1. **Jargon and Technical Terms**: Find specialized vocabulary that may confuse general readers:
   - Industry-specific acronyms used without explanation
   - Technical terms that have plain-language alternatives
   - Insider language that assumes domain expertise
   - Suggest plain-language alternatives for each instance

2. **Overly Complex Sentences**: Identify sentences that are hard to parse:
   - Sentences longer than 25-30 words that could be split
   - Multiple nested clauses that obscure meaning
   - Passive voice that could be made active
   - Dense paragraphs that need breaking up

3. **Reading Level Alignment**: Ensure content matches a general educated audience:
   - Academic language that could be simplified
   - Unnecessarily formal constructions
   - Abstract concepts that need concrete examples
   - Missing context for complex ideas

4. **Structural Clarity**: Improve how information is organized:
   - Ideas that need clearer transitions
   - Missing signposting (e.g., "First...", "In contrast...")
   - Key points buried in dense text
   - Conclusions or takeaways that could be more explicit

Focus on the MOST impactful clarity issues that prevent understanding. Suggest specific rewrites that:
- Replace jargon with accessible language
- Break complex sentences into simpler ones
- Add brief explanations for necessary technical terms
- Improve logical flow between ideas

Remember: A brief is only valuable if its audience can understand it. Aim for clarity without sacrificing accuracy.`;
  }
}
