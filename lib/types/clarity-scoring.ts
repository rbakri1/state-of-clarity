/**
 * Clarity Scoring Types
 *
 * Defines the 7 dimensions used by the consensus panel to evaluate brief clarity.
 * Each dimension has a weight that contributes to the final score.
 */

export type DimensionName =
  | "firstPrinciplesCoherence"
  | "internalConsistency"
  | "evidenceQuality"
  | "accessibility"
  | "objectivity"
  | "factualAccuracy"
  | "biasDetection";

export interface ScoringDimension {
  name: DimensionName;
  weight: number; // 0-1, all dimensions sum to 1
  description: string;
  scoringGuidelines: string;
}

export const CLARITY_DIMENSIONS: Record<DimensionName, ScoringDimension> = {
  firstPrinciplesCoherence: {
    name: "firstPrinciplesCoherence",
    weight: 0.20,
    description: "How well the brief builds arguments from foundational truths rather than assumptions",
    scoringGuidelines: `
      10: Arguments derive clearly from first principles with explicit logical chains
      8-9: Strong foundational reasoning with minor gaps
      6-7: Some first principles thinking but relies on unstated assumptions
      4-5: Mostly based on conventional wisdom without questioning premises
      1-3: Arguments built on unexamined assumptions or circular reasoning
    `.trim(),
  },
  internalConsistency: {
    name: "internalConsistency",
    weight: 0.15,
    description: "Whether the brief's claims and arguments align without contradictions",
    scoringGuidelines: `
      10: Perfect logical consistency throughout; all claims support each other
      8-9: Highly consistent with no contradictions
      6-7: Generally consistent but some tension between sections
      4-5: Notable contradictions that undermine arguments
      1-3: Major internal contradictions; arguments refute each other
    `.trim(),
  },
  evidenceQuality: {
    name: "evidenceQuality",
    weight: 0.20,
    description: "The strength, relevance, and diversity of sources and data cited",
    scoringGuidelines: `
      10: Primary sources, peer-reviewed research, diverse perspectives, all claims backed
      8-9: Strong evidence base with minor gaps; mostly primary/secondary sources
      6-7: Adequate evidence but relies heavily on secondary sources
      4-5: Weak evidence; few sources, mainly opinion or low-credibility outlets
      1-3: No evidence or only anecdotal support; claims are unsupported
    `.trim(),
  },
  accessibility: {
    name: "accessibility",
    weight: 0.15,
    description: "How easily an average educated reader can understand the content",
    scoringGuidelines: `
      10: Crystal clear; complex topics explained simply; no jargon without definition
      8-9: Highly accessible; rare jargon is explained
      6-7: Mostly clear but some sections require domain knowledge
      4-5: Dense or technical; assumes significant prior knowledge
      1-3: Impenetrable to non-specialists; unexplained jargon throughout
    `.trim(),
  },
  objectivity: {
    name: "objectivity",
    weight: 0.10,
    description: "Whether the brief presents multiple perspectives fairly without advocacy",
    scoringGuidelines: `
      10: All major perspectives presented fairly; no detectable preference
      8-9: Strong objectivity with balanced treatment
      6-7: Generally objective but slightly favors one perspective
      4-5: Clear preference for certain viewpoints; unequal treatment
      1-3: One-sided advocacy; opposing views dismissed or strawmanned
    `.trim(),
  },
  factualAccuracy: {
    name: "factualAccuracy",
    weight: 0.15,
    description: "Whether stated facts, statistics, and claims are verifiably correct",
    scoringGuidelines: `
      10: All facts verified; statistics correctly cited with context
      8-9: Highly accurate; minor issues don't affect conclusions
      6-7: Mostly accurate but some unverified claims or missing context
      4-5: Several factual errors that affect argument validity
      1-3: Major factual errors; misinformation or fabricated claims
    `.trim(),
  },
  biasDetection: {
    name: "biasDetection",
    weight: 0.05,
    description: "Identification and mitigation of cognitive, selection, or framing biases",
    scoringGuidelines: `
      10: No detectable bias; actively addresses potential biases
      8-9: Minimal bias; diverse framing and source selection
      6-7: Some bias in framing or source selection but not severe
      4-5: Notable bias in how issues are framed or evidence selected
      1-3: Severe bias; cherry-picked evidence, loaded language, misleading framing
    `.trim(),
  },
};

export interface DimensionScore {
  dimension: DimensionName;
  score: number; // 0-10
  reasoning: string;
  issues: string[];
}

export interface EvaluatorVerdict {
  evaluatorRole: "Skeptic" | "Advocate" | "Generalist" | "Arbiter";
  dimensionScores: DimensionScore[];
  overallScore: number; // 0-10, weighted average of dimension scores
  critique: string;
  issues: Issue[];
  confidence: number; // 0-1, evaluator's confidence in their assessment
  evaluatedAt: string;
}

export interface Issue {
  dimension: DimensionName;
  severity: "low" | "medium" | "high";
  description: string;
  quote?: string; // Specific text from brief that exemplifies the issue
  suggestedFix?: string;
}

export interface ClarityScore {
  overallScore: number; // 0-10, one decimal place
  dimensionBreakdown: DimensionScore[];
  critique: string; // Consolidated critique for refinement
  confidence: number; // 0-1, consensus confidence
  evaluatorVerdicts: EvaluatorVerdict[];
  consensusMethod: "median" | "post-discussion" | "tiebreaker";
  hasDisagreement: boolean;
  needsHumanReview: boolean;
  reviewReason?: string;
  scoredAt: string;
}

export interface DisagreementResult {
  hasDisagreement: boolean;
  disagreeingDimensions: DimensionName[];
  maxSpread: number;
  evaluatorPositions: {
    evaluator: string;
    overallScore: number;
    divergentDimensions: { dimension: DimensionName; score: number }[];
  }[];
}

export interface PrioritizedIssue {
  dimension: DimensionName;
  issue: string;
  suggestedFix: string;
  priority: "critical" | "high" | "medium" | "low";
  quote?: string;
  agreedByEvaluators: number; // How many evaluators flagged this
}

export function getDimensionWeight(dimension: DimensionName): number {
  return CLARITY_DIMENSIONS[dimension].weight;
}

export function getAllDimensions(): ScoringDimension[] {
  return Object.values(CLARITY_DIMENSIONS);
}

export function validateWeightsSum(): boolean {
  const sum = Object.values(CLARITY_DIMENSIONS).reduce((acc, dim) => acc + dim.weight, 0);
  return Math.abs(sum - 1.0) < 0.001; // Allow small floating point variance
}
