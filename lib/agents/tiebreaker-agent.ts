/**
 * Tiebreaker Agent
 *
 * The 4th evaluator (Arbiter) that only runs when there's strong disagreement
 * among the primary 3 evaluators (Skeptic, Advocate, Generalist).
 * Arbiter's scores are weighted 1.5x for disputed dimensions.
 * Target: <5 seconds completion.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getEvaluatorPersona } from "./clarity-evaluator-personas";
import {
  EvaluatorVerdict,
  DimensionScore,
  DimensionName,
  Issue,
  DisagreementResult,
  CLARITY_DIMENSIONS,
  getDimensionWeight,
} from "../types/clarity-scoring";
import { EvaluateBriefInput, Brief } from "./clarity-evaluator-agent";

export const ARBITER_WEIGHT_MULTIPLIER = 1.5;

export interface TiebreakerInput {
  brief: Brief | EvaluateBriefInput;
  verdicts: EvaluatorVerdict[];
  disagreement: DisagreementResult;
  discussionSummary?: string;
}

export interface TiebreakerOutput {
  verdict: EvaluatorVerdict;
  resolutionSummary: string;
  durationMs: number;
}

interface ArbiterResponse {
  disputedDimensionEvaluations: {
    dimension: DimensionName;
    evaluatorPositions: {
      evaluator: string;
      score: number;
      reasoning: string;
    }[];
    strongerArgument: string;
    definitiveScore: number;
    resolution: string;
  }[];
  otherDimensions: {
    dimension: DimensionName;
    score: number;
    reasoning: string;
  }[];
  overallCritique: string;
  resolutionSummary: string;
  confidence: number;
}

function formatVerdictForArbiter(verdict: EvaluatorVerdict, disputedDimensions: DimensionName[]): string {
  const relevantScores = verdict.dimensionScores
    .filter((d) => disputedDimensions.includes(d.dimension))
    .map((d) => `  - ${d.dimension}: ${d.score.toFixed(1)}\n    Reasoning: ${d.reasoning}`)
    .join("\n");

  const keyIssues = verdict.issues
    .filter((i) => disputedDimensions.includes(i.dimension))
    .slice(0, 3)
    .map((i) => `  - [${i.severity}] ${i.description}`)
    .join("\n");

  return `
### ${verdict.evaluatorRole} (Overall: ${verdict.overallScore.toFixed(1)})
Disputed Dimension Scores:
${relevantScores}

Related Issues:
${keyIssues || "  None"}
`;
}

function extractBriefText(brief: Brief | EvaluateBriefInput): { question: string; narrative: string } {
  if ("id" in brief) {
    return { question: brief.question, narrative: brief.narrative };
  }
  return { question: brief.question, narrative: brief.narrative };
}

function buildTiebreakerPrompt(input: TiebreakerInput): string {
  const arbiterPersona = getEvaluatorPersona("Arbiter");
  const { question, narrative } = extractBriefText(input.brief);
  const disputedDimensions = input.disagreement.disagreeingDimensions;

  const verdictsSummary = input.verdicts
    .map((v) => formatVerdictForArbiter(v, disputedDimensions))
    .join("\n");

  const dimensionGuidelines = disputedDimensions
    .map((dim) => {
      const d = CLARITY_DIMENSIONS[dim];
      return `### ${d.name} (weight: ${(d.weight * 100).toFixed(0)}%)
${d.description}
Scoring Guidelines:
${d.scoringGuidelines}`;
    })
    .join("\n\n");

  return `You are ${arbiterPersona.name}, a senior evaluator called to resolve disagreements.

## Your Role
${arbiterPersona.systemPrompt}

## Context
The 3-evaluator panel (Skeptic, Advocate, Generalist) has evaluated a political brief but strongly disagreed on certain dimensions. Your task is to provide definitive scores for the disputed dimensions.

## Disputed Dimensions
${disputedDimensions.join(", ")}

Maximum spread between evaluators: ${input.disagreement.maxSpread.toFixed(1)} points

## The Brief Being Evaluated

**Question:** ${question}

**Narrative:**
${narrative}

## Evaluator Positions

${verdictsSummary}

${input.discussionSummary ? `## Discussion Round Summary\n${input.discussionSummary}` : ""}

## Scoring Guidelines for Disputed Dimensions

${dimensionGuidelines}

## Your Task

For EACH disputed dimension:
1. Summarize each evaluator's position and reasoning
2. Identify who has the stronger argument and why
3. Provide your definitive score (0-10) with detailed justification
4. Explain how this resolves the disagreement

For other dimensions, provide standard scores based on your assessment.

Return your response as JSON:
{
  "disputedDimensionEvaluations": [
    {
      "dimension": "evidenceQuality",
      "evaluatorPositions": [
        { "evaluator": "Skeptic", "score": 5.0, "reasoning": "..." },
        { "evaluator": "Advocate", "score": 7.5, "reasoning": "..." },
        { "evaluator": "Generalist", "score": 6.0, "reasoning": "..." }
      ],
      "strongerArgument": "The Skeptic raises valid concerns about...",
      "definitiveScore": 6.0,
      "resolution": "While the Advocate correctly notes the use of primary sources, the Skeptic's concern about missing context for statistics is valid. Final score reflects solid evidence base with room for improvement."
    }
  ],
  "otherDimensions": [
    {
      "dimension": "accessibility",
      "score": 7.5,
      "reasoning": "The brief explains technical terms adequately..."
    }
  ],
  "overallCritique": "A 2-3 paragraph synthesis of the brief's quality, acknowledging the disputed areas.",
  "resolutionSummary": "Brief summary of how each dispute was resolved.",
  "confidence": 0.85
}

Rules:
- Your scores carry 1.5x weight for disputed dimensions in final calculation
- Provide thorough reasoning for disputed dimensions
- Be decisive; the panel needs resolution, not more ambiguity
- Return ONLY valid JSON, no additional text.`;
}

function parseArbiterResponse(responseText: string): ArbiterResponse {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Arbiter response");
  }
  return JSON.parse(jsonMatch[0]);
}

function buildArbiterVerdict(
  response: ArbiterResponse,
  disputedDimensions: DimensionName[]
): EvaluatorVerdict {
  const allDimensionNames = Object.keys(CLARITY_DIMENSIONS) as DimensionName[];
  
  const dimensionScores: DimensionScore[] = allDimensionNames.map((dimension) => {
    const disputed = response.disputedDimensionEvaluations.find((e) => e.dimension === dimension);
    if (disputed) {
      return {
        dimension,
        score: disputed.definitiveScore,
        reasoning: `${disputed.strongerArgument}\n\n[RESOLUTION] ${disputed.resolution}`,
        issues: [],
      };
    }

    const other = response.otherDimensions.find((o) => o.dimension === dimension);
    if (other) {
      return {
        dimension,
        score: other.score,
        reasoning: other.reasoning,
        issues: [],
      };
    }

    return {
      dimension,
      score: 5,
      reasoning: "Not explicitly evaluated by Arbiter",
      issues: [],
    };
  });

  let weightedSum = 0;
  let totalWeight = 0;
  for (const dimScore of dimensionScores) {
    const weight = getDimensionWeight(dimScore.dimension);
    weightedSum += dimScore.score * weight;
    totalWeight += weight;
  }
  const overallScore = Math.round((weightedSum / totalWeight) * 10) / 10;

  return {
    evaluatorRole: "Arbiter",
    dimensionScores,
    overallScore,
    critique: response.overallCritique,
    issues: [],
    confidence: response.confidence,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Run the tiebreaker evaluator (Arbiter) to resolve disagreements.
 * 
 * The Arbiter is only invoked when detectDisagreement() returns hasDisagreement: true.
 * Arbiter's scores are weighted 1.5x for disputed dimensions in final calculation.
 * 
 * @param input - The original brief, all verdicts, disagreement result, and optional discussion summary
 * @returns Arbiter's verdict and resolution summary
 */
export async function runTiebreaker(input: TiebreakerInput): Promise<TiebreakerOutput> {
  const startTime = Date.now();

  console.log(`[Tiebreaker] Starting Arbiter evaluation for ${input.disagreement.disagreeingDimensions.length} disputed dimensions`);

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildTiebreakerPrompt(input);

  const message = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  const response = parseArbiterResponse(responseText);
  
  const verdict = buildArbiterVerdict(response, input.disagreement.disagreeingDimensions);

  const durationMs = Date.now() - startTime;

  console.log(`[Tiebreaker] Arbiter completed in ${durationMs}ms, overall score: ${verdict.overallScore.toFixed(1)}`);

  if (durationMs > 5000) {
    console.warn(`[Tiebreaker] Duration ${durationMs}ms exceeds 5s target`);
  }

  return {
    verdict,
    resolutionSummary: response.resolutionSummary,
    durationMs,
  };
}
