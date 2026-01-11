/**
 * Refinement System Test Script
 *
 * Validates the refinement loop by testing with a mock brief that has known low-scoring dimensions.
 * Verifies: fixer deployment, edit suggestion/application, re-scoring, and max attempt limits.
 */

import {
  refineUntilPassing,
  RefinementLoopInput,
} from "@/lib/agents/refinement-loop";
import {
  ConsensusResult,
  FixerType,
  DimensionScores,
} from "@/lib/types/refinement";
import { orchestrateFixes, OrchestratorInput } from "@/lib/agents/fixers/fixer-orchestrator";

const SCORE_THRESHOLD = 7.0;

const mockBriefWithLowScores = `
# Climate Change and Economic Policy

## Executive Summary

Climate change is definitely bad and we need to fix it immediately. All scientists agree that we're doomed unless we act now. The fossil fuel industry is evil and destroying the planet for profit.

## Background

Global warming is caused by carbon emissions. The temperature has risen significantly. Some people say it's not real but they're wrong.

## Key Arguments

1. Renewable energy is always better than fossil fuels
2. Electric cars will solve all transportation problems
3. Carbon taxes are the only effective policy tool

## Recommendations

We should ban all fossil fuels immediately. Anyone who disagrees is a climate denier. The government should take control of energy production.

## Sources

- Some climate report (2020)
- A scientist said so
- Common knowledge
`;

function createLowScoresConsensusResult(): ConsensusResult {
  const dimensionScores: DimensionScores = {
    [FixerType.firstPrinciplesCoherence]: 5.5,
    [FixerType.internalConsistency]: 6.0,
    [FixerType.evidenceQuality]: 4.0,
    [FixerType.accessibility]: 7.5,
    [FixerType.objectivity]: 3.5,
    [FixerType.factualAccuracy]: 5.0,
    [FixerType.biasDetection]: 3.0,
  };

  const dimensionCritiques: Record<FixerType, string> = {
    [FixerType.firstPrinciplesCoherence]:
      "The argument jumps to conclusions without establishing foundational reasoning. No clear logical chain from evidence to recommendations.",
    [FixerType.internalConsistency]:
      "The executive summary tone differs from the more measured background section. Terminology is inconsistent.",
    [FixerType.evidenceQuality]:
      "Citations are extremely weak - 'some climate report', 'a scientist said so', and 'common knowledge' are not valid sources. Many claims lack any citation.",
    [FixerType.accessibility]:
      "Language is accessible but some policy jargon could be simplified.",
    [FixerType.objectivity]:
      "Severely one-sided presentation. No counterarguments addressed. Labels dissenters as 'evil' and 'deniers'.",
    [FixerType.factualAccuracy]:
      "Claims like 'all scientists agree' and 'we're doomed' are not factually accurate. Sweeping generalizations without verification.",
    [FixerType.biasDetection]:
      "Heavy use of loaded language: 'evil', 'definitely bad', 'doomed', 'climate denier'. Strong framing bias throughout.",
  };

  return {
    overallScore: 4.8,
    dimensionScores,
    critique:
      "This brief exhibits significant bias, lacks proper evidence, and makes sweeping claims without factual support. Major improvements needed across objectivity, evidence quality, and bias detection.",
    dimensionCritiques,
  };
}

function createModerateScoresConsensusResult(): ConsensusResult {
  const dimensionScores: DimensionScores = {
    [FixerType.firstPrinciplesCoherence]: 7.2,
    [FixerType.internalConsistency]: 7.5,
    [FixerType.evidenceQuality]: 6.5,
    [FixerType.accessibility]: 8.0,
    [FixerType.objectivity]: 6.0,
    [FixerType.factualAccuracy]: 7.0,
    [FixerType.biasDetection]: 5.5,
  };

  return {
    overallScore: 6.8,
    dimensionScores,
    critique: "Brief has improved but still needs work on objectivity and bias detection.",
    dimensionCritiques: {
      [FixerType.firstPrinciplesCoherence]: "Reasoning is clearer but could be stronger.",
      [FixerType.internalConsistency]: "Good internal consistency now.",
      [FixerType.evidenceQuality]: "Some citations added but still weak in places.",
      [FixerType.accessibility]: "Clear and accessible language.",
      [FixerType.objectivity]: "Still needs more counterarguments.",
      [FixerType.factualAccuracy]: "Most claims now verified.",
      [FixerType.biasDetection]: "Some loaded language remains.",
    },
  };
}

function createPassingScoresConsensusResult(): ConsensusResult {
  const dimensionScores: DimensionScores = {
    [FixerType.firstPrinciplesCoherence]: 8.2,
    [FixerType.internalConsistency]: 8.5,
    [FixerType.evidenceQuality]: 8.0,
    [FixerType.accessibility]: 8.5,
    [FixerType.objectivity]: 7.8,
    [FixerType.factualAccuracy]: 8.0,
    [FixerType.biasDetection]: 7.5,
  };

  return {
    overallScore: 8.1,
    dimensionScores,
    critique: "Brief now meets quality standards with balanced presentation and proper sourcing.",
    dimensionCritiques: {
      [FixerType.firstPrinciplesCoherence]: "Clear logical reasoning from evidence to conclusions.",
      [FixerType.internalConsistency]: "Consistent throughout.",
      [FixerType.evidenceQuality]: "Well-sourced with credible citations.",
      [FixerType.accessibility]: "Clear and accessible.",
      [FixerType.objectivity]: "Multiple perspectives represented.",
      [FixerType.factualAccuracy]: "Claims verified and accurate.",
      [FixerType.biasDetection]: "Neutral language used.",
    },
  };
}

async function testOrchestratorDeployment(): Promise<boolean> {
  console.log("\n=== Test 1: Verify correct fixers deployed based on dimension scores <7.0 ===\n");

  const consensusResult = createLowScoresConsensusResult();
  const input: OrchestratorInput = {
    brief: mockBriefWithLowScores,
    consensusResult,
  };

  console.log("Dimension scores:");
  for (const [dim, score] of Object.entries(consensusResult.dimensionScores)) {
    console.log(`  ${dim}: ${score} ${score < SCORE_THRESHOLD ? "(should deploy)" : "(skip)"}`);
  }

  const result = await orchestrateFixes(input);

  const expectedFixers = Object.entries(consensusResult.dimensionScores)
    .filter(([, score]) => score < SCORE_THRESHOLD)
    .map(([dim]) => dim as FixerType);

  console.log(`\nExpected fixers: ${expectedFixers.join(", ")}`);
  console.log(`Deployed fixers: ${result.fixersDeployed.join(", ")}`);

  const correctDeployment =
    expectedFixers.length === result.fixersDeployed.length &&
    expectedFixers.every((f) => result.fixersDeployed.includes(f));

  if (correctDeployment) {
    console.log("✅ PASS: Correct fixers deployed based on <7.0 threshold");
  } else {
    console.log("❌ FAIL: Incorrect fixers deployed");
  }

  console.log(`Total edits suggested: ${result.allSuggestedEdits.length}`);
  const hasEdits = result.allSuggestedEdits.length > 0;
  if (hasEdits) {
    console.log("✅ PASS: Fixers generated edit suggestions");
  } else {
    console.log("❌ FAIL: No edit suggestions generated");
  }

  return correctDeployment && hasEdits;
}

async function testRefinementLoopWithImprovement(): Promise<boolean> {
  console.log("\n=== Test 2: Verify refinement loop with score improvement ===\n");

  let attemptCount = 0;

  const mockScoringFunction = async (_brief: string): Promise<ConsensusResult> => {
    attemptCount++;
    console.log(`[MockScoring] Re-scoring after attempt ${attemptCount}`);

    if (attemptCount >= 2) {
      console.log("[MockScoring] Returning passing score (8.1)");
      return createPassingScoresConsensusResult();
    }

    console.log("[MockScoring] Returning moderate score (6.8)");
    return createModerateScoresConsensusResult();
  };

  const input: RefinementLoopInput = {
    brief: mockBriefWithLowScores,
    initialConsensusResult: createLowScoresConsensusResult(),
    scoringFunction: mockScoringFunction,
    maxAttempts: 3,
  };

  const result = await refineUntilPassing(input);

  console.log(`\nFinal score: ${result.finalScore}`);
  console.log(`Success: ${result.success}`);
  console.log(`Attempts made: ${result.attempts.length}`);

  const passedScoreCheck = result.finalScore >= 8.0;
  const passedSuccessCheck = result.success === true;
  const passedAttemptsCheck = result.attempts.length <= 3;
  const stoppedEarly = result.attempts.length === 2;

  if (passedScoreCheck) {
    console.log("✅ PASS: Final score reached target (≥8.0)");
  } else {
    console.log("❌ FAIL: Final score did not reach target");
  }

  if (passedSuccessCheck) {
    console.log("✅ PASS: Refinement marked as successful");
  } else {
    console.log("❌ FAIL: Refinement not marked as successful");
  }

  if (stoppedEarly) {
    console.log("✅ PASS: Loop stopped early when target reached (2 attempts instead of 3)");
  } else {
    console.log(`⚠️  INFO: Loop used ${result.attempts.length} attempts`);
  }

  for (const attempt of result.attempts) {
    console.log(
      `\n  Attempt ${attempt.attemptNumber}: Score ${attempt.scoreBeforeAfter.before.toFixed(1)} → ${attempt.scoreBeforeAfter.after.toFixed(1)}`
    );
    console.log(`    Fixers: ${attempt.fixersDeployed.join(", ")}`);
    console.log(`    Edits applied: ${attempt.editsMade.length}`);
    console.log(`    Edits skipped: ${attempt.editsSkipped.length}`);
  }

  return passedScoreCheck && passedSuccessCheck && passedAttemptsCheck;
}

async function testMaxAttemptsLimit(): Promise<boolean> {
  console.log("\n=== Test 3: Verify loop stops at 3 attempts max ===\n");

  let attemptCount = 0;

  const mockScoringFunction = async (_brief: string): Promise<ConsensusResult> => {
    attemptCount++;
    console.log(`[MockScoring] Re-scoring after attempt ${attemptCount} - returning low score`);
    return createModerateScoresConsensusResult();
  };

  const input: RefinementLoopInput = {
    brief: mockBriefWithLowScores,
    initialConsensusResult: createLowScoresConsensusResult(),
    scoringFunction: mockScoringFunction,
    maxAttempts: 3,
  };

  const result = await refineUntilPassing(input);

  console.log(`\nFinal score: ${result.finalScore}`);
  console.log(`Success: ${result.success}`);
  console.log(`Attempts made: ${result.attempts.length}`);
  console.log(`Warning reason: ${result.warningReason || "none"}`);

  const passedMaxAttempts = result.attempts.length <= 3;
  const failedAsExpected = result.success === false;
  const hasWarning = !!result.warningReason;

  if (passedMaxAttempts) {
    console.log("✅ PASS: Loop stopped at max attempts (≤3)");
  } else {
    console.log("❌ FAIL: Loop exceeded max attempts");
  }

  if (failedAsExpected) {
    console.log("✅ PASS: Refinement marked as failed (score < 8.0)");
  } else {
    console.log("❌ FAIL: Refinement should have failed");
  }

  if (hasWarning) {
    console.log("✅ PASS: Warning reason provided");
  } else {
    console.log("❌ FAIL: No warning reason provided");
  }

  return passedMaxAttempts && failedAsExpected && hasWarning;
}

async function testAlreadyPassingBrief(): Promise<boolean> {
  console.log("\n=== Test 4: Verify no refinement for already passing brief ===\n");

  const mockScoringFunction = async (_brief: string): Promise<ConsensusResult> => {
    throw new Error("Scoring function should not be called for passing brief");
  };

  const input: RefinementLoopInput = {
    brief: mockBriefWithLowScores,
    initialConsensusResult: createPassingScoresConsensusResult(),
    scoringFunction: mockScoringFunction,
    maxAttempts: 3,
  };

  const result = await refineUntilPassing(input);

  console.log(`\nFinal score: ${result.finalScore}`);
  console.log(`Success: ${result.success}`);
  console.log(`Attempts made: ${result.attempts.length}`);

  const noAttempts = result.attempts.length === 0;
  const stillSuccess = result.success === true;
  const scorePreserved = result.finalScore >= 8.0;

  if (noAttempts) {
    console.log("✅ PASS: No refinement attempts for already passing brief");
  } else {
    console.log("❌ FAIL: Unnecessary refinement attempts made");
  }

  if (stillSuccess) {
    console.log("✅ PASS: Brief marked as successful");
  } else {
    console.log("❌ FAIL: Brief should be successful");
  }

  if (scorePreserved) {
    console.log("✅ PASS: Score preserved at passing level");
  } else {
    console.log("❌ FAIL: Score not preserved");
  }

  return noAttempts && stillSuccess && scorePreserved;
}

async function runAllTests(): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           REFINEMENT SYSTEM TEST SUITE                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: { name: string; passed: boolean }[] = [];

  try {
    results.push({
      name: "Orchestrator deployment based on <7.0 scores",
      passed: await testOrchestratorDeployment(),
    });
  } catch (error) {
    console.error("Test 1 failed with error:", error);
    results.push({ name: "Orchestrator deployment", passed: false });
  }

  try {
    results.push({
      name: "Refinement loop with score improvement",
      passed: await testRefinementLoopWithImprovement(),
    });
  } catch (error) {
    console.error("Test 2 failed with error:", error);
    results.push({ name: "Refinement loop improvement", passed: false });
  }

  try {
    results.push({
      name: "Max attempts limit (stops at 3)",
      passed: await testMaxAttemptsLimit(),
    });
  } catch (error) {
    console.error("Test 3 failed with error:", error);
    results.push({ name: "Max attempts limit", passed: false });
  }

  try {
    results.push({
      name: "Already passing brief (no refinement needed)",
      passed: await testAlreadyPassingBrief(),
    });
  } catch (error) {
    console.error("Test 4 failed with error:", error);
    results.push({ name: "Already passing brief", passed: false });
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    TEST RESULTS                            ║");
  console.log("╠════════════════════════════════════════════════════════════╣");

  for (const result of results) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`║ ${status} | ${result.name.padEnd(45)} ║`);
  }

  const allPassed = results.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;

  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(
    `║ ${allPassed ? "✅" : "❌"} ${passedCount}/${results.length} tests passed${" ".repeat(43)}║`
  );
  console.log("╚════════════════════════════════════════════════════════════╝");

  if (!allPassed) {
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
