/**
 * Discussion Round Agent
 *
 * Facilitates a discussion round where evaluators see each other's scores
 * and can revise their assessments. Each evaluator reviews the other
 * perspectives and decides whether to maintain or revise their scores.
 * Target: <5 seconds total for all 3 evaluators.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getEvaluatorPersona, EvaluatorPersona } from "./clarity-evaluator-personas";
import {
  EvaluatorVerdict,
  DimensionScore,
  DimensionName,
  Issue,
  CLARITY_DIMENSIONS,
  getDimensionWeight,
} from "../types/clarity-scoring";
import { EvaluateBriefInput, Brief } from "./clarity-evaluator-agent";

export interface DiscussionRoundInput {
  brief: Brief | EvaluateBriefInput;
  verdicts: EvaluatorVerdict[];
}

export interface DiscussionRoundOutput {
  revisedVerdicts: EvaluatorVerdict[];
  discussionSummary: string;
  changesCount: number;
  durationMs: number;
}

interface DiscussionResponse {
  revisedDimensions: {
    dimension: DimensionName;
    originalScore: number;
    revisedScore: number;
    reasonForChange: string;
  }[];
  maintainedPositions: {
    dimension: DimensionName;
    score: number;
    justification: string;
  }[];
  overallReflection: string;
}

function formatVerdictForDiscussion(verdict: EvaluatorVerdict): string {
  const dimensionsSummary = verdict.dimensionScores
    .map((d) => `  - ${d.dimension}: ${d.score.toFixed(1)} — ${d.reasoning.substring(0, 100)}...`)
    .join("\n");

  return `
### ${verdict.evaluatorRole} (Overall: ${verdict.overallScore.toFixed(1)})
${dimensionsSummary}

Key Issues Identified:
${verdict.issues.slice(0, 3).map((i) => `  - [${i.severity}] ${i.description}`).join("\n")}
`;
}

function buildDiscussionPrompt(
  persona: EvaluatorPersona,
  allVerdicts: EvaluatorVerdict[],
  ownVerdict: EvaluatorVerdict
): string {
  const otherVerdicts = allVerdicts.filter((v) => v.evaluatorRole !== ownVerdict.evaluatorRole);

  return `You are ${persona.name} participating in a discussion round.

## Context
You have evaluated a political brief and scored it across 7 dimensions. Now you can see how the other evaluators scored it. Consider their perspectives and decide whether to revise any of your scores.

## Your Original Assessment
${formatVerdictForDiscussion(ownVerdict)}

## Other Evaluators' Assessments
${otherVerdicts.map(formatVerdictForDiscussion).join("\n")}

## Your Task
Review the other evaluators' perspectives. For each dimension, decide:
1. Should you REVISE your score based on something the others noticed that you missed?
2. Should you MAINTAIN your score with clear justification for why your perspective stands?

Guidelines:
- Only revise if the others raise valid points you overlooked
- Don't revise just to converge; maintain your position if you have good reasons
- If revising, explain what specifically changed your mind
- Maximum score change should be 2 points per dimension

Return your response as JSON:
{
  "revisedDimensions": [
    {
      "dimension": "evidenceQuality",
      "originalScore": 6.5,
      "revisedScore": 7.0,
      "reasonForChange": "The Advocate correctly noted I overlooked the primary source citation in paragraph 3..."
    }
  ],
  "maintainedPositions": [
    {
      "dimension": "accessibility",
      "score": 8.0,
      "justification": "While the Skeptic rated this lower, I maintain that the technical terms are adequately explained..."
    }
  ],
  "overallReflection": "After reviewing the other perspectives, I found [summary of what changed and why]"
}

Rules:
- Every dimension must appear in either revisedDimensions or maintainedPositions
- Score changes cannot exceed 2 points from original
- Provide clear reasoning for every decision
- Return ONLY valid JSON, no additional text.`;
}

function parseDiscussionResponse(responseText: string): DiscussionResponse {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from discussion response");
  }
  return JSON.parse(jsonMatch[0]);
}

function applyRevisionsToVerdict(
  originalVerdict: EvaluatorVerdict,
  discussionResponse: DiscussionResponse
): EvaluatorVerdict {
  const revisedScores = new Map(
    discussionResponse.revisedDimensions.map((r) => [r.dimension, r])
  );

  const updatedDimensionScores: DimensionScore[] = originalVerdict.dimensionScores.map(
    (original) => {
      const revision = revisedScores.get(original.dimension);
      if (revision) {
        return {
          ...original,
          score: revision.revisedScore,
          reasoning: `${original.reasoning}\n\n[REVISED] ${revision.reasonForChange}`,
        };
      }
      return original;
    }
  );

  let weightedSum = 0;
  let totalWeight = 0;
  for (const dimScore of updatedDimensionScores) {
    const weight = getDimensionWeight(dimScore.dimension);
    weightedSum += dimScore.score * weight;
    totalWeight += weight;
  }
  const newOverallScore = Math.round((weightedSum / totalWeight) * 10) / 10;

  return {
    ...originalVerdict,
    dimensionScores: updatedDimensionScores,
    overallScore: newOverallScore,
    critique: `${originalVerdict.critique}\n\n[POST-DISCUSSION] ${discussionResponse.overallReflection}`,
    evaluatedAt: new Date().toISOString(),
  };
}

async function runEvaluatorDiscussion(
  persona: EvaluatorPersona,
  allVerdicts: EvaluatorVerdict[],
  ownVerdict: EvaluatorVerdict
): Promise<{ revised: EvaluatorVerdict; response: DiscussionResponse; durationMs: number }> {
  const startTime = Date.now();

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildDiscussionPrompt(persona, allVerdicts, ownVerdict);

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  const discussionResponse = parseDiscussionResponse(responseText);
  const revisedVerdict = applyRevisionsToVerdict(ownVerdict, discussionResponse);

  const durationMs = Date.now() - startTime;
  console.log(
    `[Discussion Round] ${persona.name} completed in ${durationMs}ms, ` +
    `revisions: ${discussionResponse.revisedDimensions.length}`
  );

  return { revised: revisedVerdict, response: discussionResponse, durationMs };
}

function generateDiscussionSummary(
  originalVerdicts: EvaluatorVerdict[],
  discussionResponses: { role: string; response: DiscussionResponse }[]
): string {
  const changes: string[] = [];
  let totalRevisions = 0;

  for (const { role, response } of discussionResponses) {
    if (response.revisedDimensions.length > 0) {
      totalRevisions += response.revisedDimensions.length;
      for (const revision of response.revisedDimensions) {
        const direction = revision.revisedScore > revision.originalScore ? "↑" : "↓";
        changes.push(
          `${role} revised ${revision.dimension}: ${revision.originalScore} ${direction} ${revision.revisedScore}`
        );
      }
    }
  }

  if (totalRevisions === 0) {
    return "All evaluators maintained their original positions after reviewing other perspectives.";
  }

  return `Discussion round completed with ${totalRevisions} score revisions:\n` +
    changes.map((c) => `- ${c}`).join("\n");
}

/**
 * Run a discussion round where evaluators review each other's assessments
 * and can revise their scores.
 *
 * @param input - The verdicts from the initial evaluation round
 * @returns Revised verdicts and discussion summary
 */
export async function runDiscussionRound(
  input: DiscussionRoundInput
): Promise<DiscussionRoundOutput> {
  const overallStartTime = Date.now();

  console.log(`[Discussion Round] Starting discussion with ${input.verdicts.length} evaluators`);

  const discussionPromises = input.verdicts.map((verdict) => {
    const persona = getEvaluatorPersona(verdict.evaluatorRole);
    return runEvaluatorDiscussion(persona, input.verdicts, verdict).then((result) => ({
      ...result,
      role: verdict.evaluatorRole,
    }));
  });

  const results = await Promise.all(discussionPromises);

  const revisedVerdicts = results.map((r) => r.revised);
  const discussionResponses = results.map((r) => ({ role: r.role, response: r.response }));

  const changesCount = discussionResponses.reduce(
    (sum, dr) => sum + dr.response.revisedDimensions.length,
    0
  );

  const discussionSummary = generateDiscussionSummary(input.verdicts, discussionResponses);

  const durationMs = Date.now() - overallStartTime;

  console.log(`[Discussion Round] Completed in ${durationMs}ms, total changes: ${changesCount}`);

  if (durationMs > 5000) {
    console.warn(`[Discussion Round] Duration ${durationMs}ms exceeds 5s target`);
  }

  return {
    revisedVerdicts,
    discussionSummary,
    changesCount,
    durationMs,
  };
}
