/**
 * Evidence Quality Fixer
 *
 * Analyzes briefs for source usage and citation quality issues.
 * Identifies claims lacking citation, suggests stronger sources,
 * and flags over-reliance on single sources.
 */

import { BaseFixer } from "./base-fixer";
import { FixerType, FixerInput } from "@/lib/types/refinement";

export class EvidenceFixer extends BaseFixer {
  readonly fixerType = FixerType.evidenceQuality;
  readonly description =
    "improving source usage, citations, and evidence quality";

  protected buildPrompt(input: FixerInput): string {
    const { brief, dimensionScore, critique } = input;

    return `Analyze this brief for evidence quality issues. The current score for this dimension is ${dimensionScore}/10.

${critique ? `Evaluator critique: "${critique}"` : ""}

## Brief Content:
${brief}

## Your Task:
Identify and suggest fixes for evidence quality problems:

1. **Claims Lacking Citation**: Find factual claims, statistics, or assertions that are not attributed to a source. For example:
   - "Studies show that..." without specifying which studies
   - Specific numbers or percentages without a source
   - Claims about what experts believe without citing any expert

2. **Weak or Inadequate Citations**: Identify where sources could be stronger:
   - Reliance on outdated sources when newer data is available
   - Using secondary sources when primary sources exist
   - Citing opinion pieces for factual claims
   - Using non-authoritative sources for authoritative claims

3. **Over-Reliance on Single Source**: Flag when the brief depends too heavily on one source:
   - Multiple key claims all citing the same source
   - Entire sections built on a single reference
   - Lack of corroborating evidence from independent sources

4. **Source-Claim Alignment**: Ensure cited sources actually support the claims:
   - Claims that overstate what the source actually says
   - Cherry-picked quotes that misrepresent the source's conclusion
   - Sources that are tangentially related but don't directly support the claim

Focus on the MOST impactful evidence gaps that undermine the brief's credibility. Suggest specific text modifications that either:
- Add appropriate hedging language for unsupported claims
- Indicate where additional citations are needed
- Recommend diversifying source base

Remember: Strong evidence is the foundation of a credible brief. Every major claim should be traceable to a reliable source.`;
  }
}
