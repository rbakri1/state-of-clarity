/**
 * Quality Gate Orchestrator
 *
 * Runs the full quality assurance cycle:
 * 1. Consensus scoring - evaluate brief quality
 * 2. Check threshold - determine if acceptable
 * 3. Refinement loop - attempt improvements if needed
 * 4. Final decision - tier classification and publishing decision
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  QualityGateResult,
  QualityTier,
  createQualityGateResult,
} from "@/lib/types/quality-gate";
import { Source } from "./research-agent";

interface BriefContent {
  title: string;
  summary: string;
  content: string;
  sources: Source[];
}

interface ConsensusScore {
  score: number;
  reasoning: string;
  evaluatorScores: { evaluator: string; score: number; reasoning: string }[];
}

interface RefinementResult {
  improved: boolean;
  newContent?: BriefContent;
  reason: string;
}

const MAX_REFINEMENT_ATTEMPTS = 3;
const SCORE_THRESHOLD_HIGH = 8.0;
const SCORE_THRESHOLD_ACCEPTABLE = 6.0;

/**
 * Main Quality Gate orchestrator
 */
export async function runQualityGate(
  brief: BriefContent,
  sources: Source[]
): Promise<QualityGateResult> {
  console.log("[Quality Gate] Starting quality assurance cycle");

  let currentBrief = brief;
  let attempts = 0;
  let currentScore: ConsensusScore | null = null;

  while (attempts < MAX_REFINEMENT_ATTEMPTS) {
    attempts++;
    console.log(`[Quality Gate] Attempt ${attempts}/${MAX_REFINEMENT_ATTEMPTS}`);

    currentScore = await runConsensusScoring(currentBrief, sources);
    console.log(
      `[Quality Gate] Consensus score: ${currentScore.score.toFixed(1)}/10`
    );

    const decision = getTierDecision(currentScore.score);
    console.log(`[Quality Gate] Decision: ${decision.reasoning}`);

    if (decision.tier === QualityTier.HIGH) {
      return createQualityGateResult(currentScore.score, attempts);
    }

    if (decision.tier === QualityTier.ACCEPTABLE) {
      return createQualityGateResult(currentScore.score, attempts);
    }

    if (attempts < MAX_REFINEMENT_ATTEMPTS) {
      console.log("[Quality Gate] Score <6.0 - Attempting refinement");
      const refinementResult = await runRefinementLoop(
        currentBrief,
        sources,
        currentScore
      );

      if (refinementResult.improved && refinementResult.newContent) {
        currentBrief = refinementResult.newContent;
        console.log(
          `[Quality Gate] Refinement complete: ${refinementResult.reason}`
        );
      } else {
        console.log(
          `[Quality Gate] Refinement failed: ${refinementResult.reason}`
        );
        break;
      }
    }
  }

  const finalDecision = getTierDecision(currentScore?.score || 0);
  console.log(`[Quality Gate] Final decision: ${finalDecision.reasoning}`);
  return createQualityGateResult(currentScore?.score || 0, attempts);
}

/**
 * Run consensus scoring with 3 evaluator agents
 */
async function runConsensusScoring(
  brief: BriefContent,
  sources: Source[]
): Promise<ConsensusScore> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const evaluators = [
    {
      name: "Clarity Expert",
      focus: "Assess clarity of writing, logical flow, and accessibility for general audience",
    },
    {
      name: "Evidence Analyst",
      focus: "Evaluate evidence quality, source diversity, and factual support for claims",
    },
    {
      name: "Objectivity Judge",
      focus: "Check for balanced perspective, neutrality, and fair representation of viewpoints",
    },
  ];

  const evaluatorPromises = evaluators.map(async (evaluator) => {
    const prompt = `You are a ${evaluator.name}. ${evaluator.focus}.

Evaluate this intelligence brief on a scale of 0-10:

**Title:** ${brief.title}

**Summary:** ${brief.summary}

**Content:** ${brief.content}

**Sources used:** ${sources.length} sources (${sources.filter((s) => s.source_type === "primary").length} primary, ${sources.filter((s) => s.political_lean === "left" || s.political_lean === "center-left").length} left-leaning, ${sources.filter((s) => s.political_lean === "right" || s.political_lean === "center-right").length} right-leaning)

Score criteria:
- 9-10: Exceptional, publishable as-is
- 7-8: Good, minor issues only
- 5-6: Acceptable, some concerns
- 3-4: Below average, significant issues
- 1-2: Poor, major problems

Return JSON:
{
  "score": <number 0-10>,
  "reasoning": "<brief explanation of score>"
}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { evaluator: evaluator.name, score: 5, reasoning: "Parse error" };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      evaluator: evaluator.name,
      score: result.score,
      reasoning: result.reasoning,
    };
  });

  const evaluatorScores = await Promise.all(evaluatorPromises);
  const avgScore =
    evaluatorScores.reduce((sum, e) => sum + e.score, 0) / evaluatorScores.length;

  return {
    score: avgScore,
    reasoning: evaluatorScores.map((e) => `${e.evaluator}: ${e.reasoning}`).join("; "),
    evaluatorScores,
  };
}

/**
 * Run refinement loop to improve brief quality
 */
async function runRefinementLoop(
  brief: BriefContent,
  sources: Source[],
  currentScore: ConsensusScore
): Promise<RefinementResult> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const lowestScorer = currentScore.evaluatorScores.reduce((min, e) =>
    e.score < min.score ? e : min
  );

  const refinementPrompt = `You are a content refinement specialist. The following brief scored ${currentScore.score.toFixed(1)}/10.

The lowest score came from the ${lowestScorer.evaluator}: "${lowestScorer.reasoning}"

**Current Brief:**
Title: ${brief.title}
Summary: ${brief.summary}
Content: ${brief.content}

Your task: Improve the brief to address the feedback. Focus on:
${lowestScorer.evaluator === "Clarity Expert" ? "- Improve writing clarity, logical flow, and accessibility" : ""}
${lowestScorer.evaluator === "Evidence Analyst" ? "- Strengthen evidence quality and source integration" : ""}
${lowestScorer.evaluator === "Objectivity Judge" ? "- Improve balance and fair representation of viewpoints" : ""}

Return JSON:
{
  "improved": true,
  "title": "<improved title if needed, or same>",
  "summary": "<improved summary>",
  "content": "<improved content>",
  "changes_made": "<brief description of improvements>"
}

Or if you cannot improve it:
{
  "improved": false,
  "reason": "<why improvement is not possible>"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    messages: [{ role: "user", content: refinementPrompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return { improved: false, reason: "Failed to parse refinement response" };
  }

  const result = JSON.parse(jsonMatch[0]);

  if (!result.improved) {
    return { improved: false, reason: result.reason || "Unknown reason" };
  }

  return {
    improved: true,
    newContent: {
      title: result.title || brief.title,
      summary: result.summary || brief.summary,
      content: result.content || brief.content,
      sources: sources,
    },
    reason: result.changes_made || "Content improved",
  };
}

/**
 * Get tier classification details for logging
 */
export function getTierDecision(score: number): {
  tier: QualityTier;
  publishable: boolean;
  warningBadge: boolean;
  refundRequired: boolean;
  reasoning: string;
} {
  if (score >= SCORE_THRESHOLD_HIGH) {
    return {
      tier: QualityTier.HIGH,
      publishable: true,
      warningBadge: false,
      refundRequired: false,
      reasoning: `Score ${score.toFixed(1)} ≥ ${SCORE_THRESHOLD_HIGH}: High quality, publishing normally`,
    };
  }

  if (score >= SCORE_THRESHOLD_ACCEPTABLE) {
    return {
      tier: QualityTier.ACCEPTABLE,
      publishable: true,
      warningBadge: true,
      refundRequired: false,
      reasoning: `Score ${score.toFixed(1)} ≥ ${SCORE_THRESHOLD_ACCEPTABLE}: Acceptable quality, publishing with warning`,
    };
  }

  return {
    tier: QualityTier.FAILED,
    publishable: false,
    warningBadge: false,
    refundRequired: true,
    reasoning: `Score ${score.toFixed(1)} < ${SCORE_THRESHOLD_ACCEPTABLE}: Failed quality gate, refund required`,
  };
}
