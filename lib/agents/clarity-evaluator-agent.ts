/**
 * Clarity Evaluator Agent
 *
 * Scores a brief from a single evaluator's perspective.
 * Uses Claude Haiku for cost efficiency (~£0.015 per evaluation).
 * Target: <5 seconds per evaluator.
 */

import Anthropic from "@anthropic-ai/sdk";
import { EvaluatorPersona } from "./clarity-evaluator-personas";
import {
  DimensionName,
  DimensionScore,
  EvaluatorVerdict,
  Issue,
  CLARITY_DIMENSIONS,
  getDimensionWeight,
} from "../types/clarity-scoring";
import { Database } from "../supabase/client";

export type Brief = Database["public"]["Tables"]["briefs"]["Row"];

export interface EvaluateBriefInput {
  question: string;
  narrative: string;
  summaries?: Record<string, string>;
  structuredData?: Record<string, unknown>;
}

interface ClaudeEvaluationResponse {
  dimensions: {
    dimension: DimensionName;
    score: number;
    reasoning: string;
    issues: string[];
  }[];
  overallCritique: string;
  issues: {
    dimension: DimensionName;
    severity: "low" | "medium" | "high";
    description: string;
    quote?: string;
    suggestedFix?: string;
  }[];
  confidence: number;
}

function buildDimensionGuidelines(): string {
  return Object.values(CLARITY_DIMENSIONS)
    .map(
      (dim) => `
### ${dim.name} (weight: ${(dim.weight * 100).toFixed(0)}%)
${dim.description}

Scoring Guidelines:
${dim.scoringGuidelines}
`
    )
    .join("\n");
}

function buildEvaluationPrompt(
  brief: EvaluateBriefInput,
  persona: EvaluatorPersona
): string {
  const dimensionGuidelinesText = buildDimensionGuidelines();

  return `You are evaluating a political brief as ${persona.name}.

## Your Role
${persona.systemPrompt}

## Focus Dimensions
While you score all 7 dimensions, pay special attention to: ${persona.focusDimensions.join(", ")}

## Brief to Evaluate

**Question:** ${brief.question}

**Narrative:**
${brief.narrative}

${
  brief.summaries
    ? `**Summaries:**
${JSON.stringify(brief.summaries, null, 2)}`
    : ""
}

## Scoring Dimensions

${dimensionGuidelinesText}

## Required Output

Provide your evaluation as JSON with this exact structure:
{
  "dimensions": [
    {
      "dimension": "firstPrinciplesCoherence",
      "score": 7.5,
      "reasoning": "The brief builds from basic economic principles but...",
      "issues": ["Assumes economic growth is inherently good without justification"]
    },
    // ... all 7 dimensions
  ],
  "overallCritique": "A 2-3 paragraph overall assessment of the brief's clarity and quality.",
  "issues": [
    {
      "dimension": "evidenceQuality",
      "severity": "high",
      "description": "Claims about productivity gains lack primary sources",
      "quote": "Studies show productivity increases by 25%",
      "suggestedFix": "Cite specific studies with methodology details"
    }
  ],
  "confidence": 0.85
}

Scoring Rules:
- Score each dimension 0-10 (one decimal place allowed)
- Use the full range; reserve 9-10 for truly exceptional work
- Your reasoning should cite specific examples from the brief
- List 3-8 specific issues found
- Confidence is 0-1 reflecting your certainty in the assessment

Return ONLY valid JSON, no additional text.`;
}

function extractBriefInput(brief: Brief): EvaluateBriefInput {
  return {
    question: brief.question,
    narrative: brief.narrative,
    summaries: brief.summaries as Record<string, string> | undefined,
    structuredData: brief.structured_data as Record<string, unknown> | undefined,
  };
}

function calculateWeightedOverallScore(dimensionScores: DimensionScore[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const dimScore of dimensionScores) {
    const weight = getDimensionWeight(dimScore.dimension);
    weightedSum += dimScore.score * weight;
    totalWeight += weight;
  }

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

function parseClaudeResponse(responseText: string): ClaudeEvaluationResponse {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Claude response");
  }
  return JSON.parse(jsonMatch[0]);
}

export async function evaluateBrief(
  brief: Brief | EvaluateBriefInput,
  persona: EvaluatorPersona
): Promise<EvaluatorVerdict> {
  const startTime = Date.now();

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const briefInput = "id" in brief ? extractBriefInput(brief) : brief;
  const prompt = buildEvaluationPrompt(briefInput, persona);

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  const parsed = parseClaudeResponse(responseText);

  const dimensionScores: DimensionScore[] = parsed.dimensions.map((dim) => ({
    dimension: dim.dimension,
    score: dim.score,
    reasoning: dim.reasoning,
    issues: dim.issues,
  }));

  const issues: Issue[] = parsed.issues.map((issue) => ({
    dimension: issue.dimension,
    severity: issue.severity,
    description: issue.description,
    quote: issue.quote,
    suggestedFix: issue.suggestedFix,
  }));

  const overallScore = calculateWeightedOverallScore(dimensionScores);

  const duration = Date.now() - startTime;
  console.log(
    `[Clarity Evaluator] ${persona.name} completed in ${duration}ms`
  );

  return {
    evaluatorRole: persona.role,
    dimensionScores,
    overallScore,
    critique: parsed.overallCritique,
    issues,
    confidence: parsed.confidence,
    evaluatedAt: new Date().toISOString(),
  };
}
