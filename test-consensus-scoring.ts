/**
 * Test Consensus Scoring System
 *
 * Validates the 3-agent consensus panel (Skeptic, Advocate, Generalist)
 * with discussion rounds and tiebreaker logic.
 */

import {
  runParallelEvaluators,
  detectDisagreement,
  calculateFinalScore,
  aggregateCritiques,
  ConsensusInput,
} from "./lib/agents/consensus-scorer";
import { runDiscussionRound } from "./lib/agents/discussion-round-agent";
import { runTiebreaker } from "./lib/agents/tiebreaker-agent";
import { EvaluateBriefInput } from "./lib/agents/clarity-evaluator-agent";
import { EvaluatorRole } from "./lib/agents/clarity-evaluator-personas";
import {
  EvaluatorVerdict,
  DimensionName,
  DisagreementResult,
  CLARITY_DIMENSIONS,
} from "./lib/types/clarity-scoring";
import * as fs from "fs";
import * as path from "path";

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(message: string): void {
  console.log(`[Test] ${message}`);
}

function logResult(result: TestResult): void {
  const status = result.passed ? "✓" : "✗";
  const duration = result.duration ? ` (${result.duration}ms)` : "";
  console.log(`${status} ${result.testName}${duration}: ${result.message}`);
  results.push(result);
}

function isValidScore(score: number): boolean {
  return typeof score === "number" && score >= 0 && score <= 10;
}

function loadSampleBrief(): EvaluateBriefInput {
  const briefPath = path.join(__dirname, "sample-briefs", "uk-four-day-week.json");
  const briefData = JSON.parse(fs.readFileSync(briefPath, "utf-8"));

  return {
    question: briefData.question,
    narrative: briefData.narrative,
    structuredData: briefData.structured_data,
  };
}

function createDivergentVerdicts(): EvaluatorVerdict[] {
  const dimensionNames = Object.keys(CLARITY_DIMENSIONS) as DimensionName[];

  const baseScores: Record<DimensionName, number[]> = {
    firstPrinciplesCoherence: [8.0, 8.5, 8.0],
    internalConsistency: [7.0, 7.5, 7.0],
    evidenceQuality: [4.0, 8.0, 6.0], // Spread > 2 (divergent)
    accessibility: [7.5, 7.0, 7.5],
    objectivity: [6.0, 6.5, 6.0],
    factualAccuracy: [5.0, 9.0, 7.0], // Spread > 2 (divergent)
    biasDetection: [7.0, 7.5, 7.0],
  };

  const roles: EvaluatorRole[] = ["Skeptic", "Advocate", "Generalist"];

  return roles.map((role, roleIndex) => {
    const dimensionScores = dimensionNames.map((dim) => ({
      dimension: dim,
      score: baseScores[dim][roleIndex],
      reasoning: `Test reasoning for ${dim} from ${role}`,
      issues: [],
    }));

    const overallScore =
      dimensionScores.reduce((sum, d) => sum + d.score, 0) / dimensionScores.length;

    return {
      evaluatorRole: role,
      dimensionScores,
      overallScore,
      critique: `Test critique from ${role}`,
      issues: [
        {
          dimension: "evidenceQuality" as DimensionName,
          severity: "medium" as const,
          description: `Test issue from ${role}`,
        },
      ],
      confidence: 0.8,
      evaluatedAt: new Date().toISOString(),
    };
  });
}

async function testParallelEvaluators(brief: EvaluateBriefInput): Promise<ConsensusInput | null> {
  log("Testing parallel evaluators with sample brief...");
  const startTime = Date.now();

  try {
    const consensusInput = await runParallelEvaluators(brief);
    const duration = Date.now() - startTime;

    if (consensusInput.verdicts.length !== 3) {
      logResult({
        testName: "Parallel Evaluators - Count",
        passed: false,
        message: `Expected 3 verdicts, got ${consensusInput.verdicts.length}`,
        duration,
      });
      return null;
    }

    logResult({
      testName: "Parallel Evaluators - Count",
      passed: true,
      message: "3 evaluators produced verdicts",
      duration,
    });

    let allScoresValid = true;
    for (const verdict of consensusInput.verdicts) {
      if (!isValidScore(verdict.overallScore)) {
        allScoresValid = false;
        log(`  Invalid overall score for ${verdict.evaluatorRole}: ${verdict.overallScore}`);
      }

      for (const dimScore of verdict.dimensionScores) {
        if (!isValidScore(dimScore.score)) {
          allScoresValid = false;
          log(`  Invalid ${dimScore.dimension} score for ${verdict.evaluatorRole}: ${dimScore.score}`);
        }
      }
    }

    logResult({
      testName: "Parallel Evaluators - Valid Scores (0-10)",
      passed: allScoresValid,
      message: allScoresValid
        ? "All scores in 0-10 range"
        : "Some scores outside 0-10 range",
    });

    const roles = consensusInput.verdicts.map((v) => v.evaluatorRole);
    const expectedRoles: EvaluatorRole[] = ["Skeptic", "Advocate", "Generalist"];
    const hasAllRoles = expectedRoles.every((r) => roles.includes(r));

    logResult({
      testName: "Parallel Evaluators - Roles",
      passed: hasAllRoles,
      message: hasAllRoles
        ? "All expected evaluator roles present"
        : `Missing roles: ${expectedRoles.filter((r) => !roles.includes(r)).join(", ")}`,
    });

    log("\n  Evaluator Results:");
    for (const verdict of consensusInput.verdicts) {
      log(`    ${verdict.evaluatorRole}: ${verdict.overallScore.toFixed(1)} (${verdict.issues.length} issues)`);
    }

    return consensusInput;
  } catch (error) {
    logResult({
      testName: "Parallel Evaluators",
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
    return null;
  }
}

async function testDiscussionRound(consensusInput: ConsensusInput): Promise<EvaluatorVerdict[] | null> {
  log("\nTesting discussion round...");
  const startTime = Date.now();

  try {
    const discussionOutput = await runDiscussionRound({
      brief: consensusInput.brief,
      verdicts: consensusInput.verdicts,
    });
    const duration = Date.now() - startTime;

    if (discussionOutput.revisedVerdicts.length !== 3) {
      logResult({
        testName: "Discussion Round - Revised Verdicts",
        passed: false,
        message: `Expected 3 revised verdicts, got ${discussionOutput.revisedVerdicts.length}`,
        duration,
      });
      return null;
    }

    logResult({
      testName: "Discussion Round - Revised Verdicts",
      passed: true,
      message: `3 revised verdicts produced (${discussionOutput.changesCount} revisions)`,
      duration,
    });

    let allScoresValid = true;
    for (const verdict of discussionOutput.revisedVerdicts) {
      if (!isValidScore(verdict.overallScore)) {
        allScoresValid = false;
      }
      for (const dimScore of verdict.dimensionScores) {
        if (!isValidScore(dimScore.score)) {
          allScoresValid = false;
        }
      }
    }

    logResult({
      testName: "Discussion Round - Valid Revised Scores",
      passed: allScoresValid,
      message: allScoresValid
        ? "All revised scores in 0-10 range"
        : "Some revised scores outside 0-10 range",
    });

    log(`  Discussion Summary: ${discussionOutput.discussionSummary.substring(0, 100)}...`);

    return discussionOutput.revisedVerdicts;
  } catch (error) {
    logResult({
      testName: "Discussion Round",
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
    return null;
  }
}

function testDisagreementDetectionWithDivergentScores(): DisagreementResult {
  log("\nTesting disagreement detection with artificially divergent scores...");

  const divergentVerdicts = createDivergentVerdicts();
  const disagreement = detectDisagreement(divergentVerdicts);

  logResult({
    testName: "Disagreement Detection - Detects Divergence",
    passed: disagreement.hasDisagreement === true,
    message: disagreement.hasDisagreement
      ? `Disagreement detected (max spread: ${disagreement.maxSpread.toFixed(1)})`
      : "Failed to detect divergent scores",
  });

  const expectedDivergent: DimensionName[] = ["evidenceQuality", "factualAccuracy"];
  const foundAll = expectedDivergent.every((d) =>
    disagreement.disagreeingDimensions.includes(d)
  );

  logResult({
    testName: "Disagreement Detection - Correct Dimensions",
    passed: foundAll,
    message: foundAll
      ? `Found divergent dimensions: ${disagreement.disagreeingDimensions.join(", ")}`
      : `Expected ${expectedDivergent.join(", ")}, got ${disagreement.disagreeingDimensions.join(", ")}`,
  });

  return disagreement;
}

function testFinalScoreCalculation(verdicts: EvaluatorVerdict[]): void {
  log("\nTesting final score calculation...");

  const disagreement = detectDisagreement(verdicts);

  const finalScore = calculateFinalScore({
    verdicts,
    disagreement: disagreement.hasDisagreement ? disagreement : undefined,
    discussionOccurred: true,
  });

  logResult({
    testName: "Final Score - Valid Range",
    passed: isValidScore(finalScore.overallScore),
    message: isValidScore(finalScore.overallScore)
      ? `Final score: ${finalScore.overallScore.toFixed(1)}`
      : `Invalid final score: ${finalScore.overallScore}`,
  });

  logResult({
    testName: "Final Score - Has Dimension Breakdown",
    passed: finalScore.dimensionBreakdown.length === 7,
    message:
      finalScore.dimensionBreakdown.length === 7
        ? "All 7 dimensions present in breakdown"
        : `Expected 7 dimensions, got ${finalScore.dimensionBreakdown.length}`,
  });

  logResult({
    testName: "Final Score - Has Consensus Method",
    passed: ["median", "post-discussion", "tiebreaker"].includes(finalScore.consensusMethod),
    message: `Consensus method: ${finalScore.consensusMethod}`,
  });

  logResult({
    testName: "Final Score - Has Critique",
    passed: typeof finalScore.critique === "string" && finalScore.critique.length > 0,
    message:
      finalScore.critique.length > 0
        ? `Critique present (${finalScore.critique.length} chars)`
        : "Missing critique",
  });

  log(`  Dimension Breakdown:`);
  for (const dim of finalScore.dimensionBreakdown) {
    log(`    ${dim.dimension}: ${dim.score.toFixed(1)}`);
  }
}

function testAggregateCritiques(verdicts: EvaluatorVerdict[]): void {
  log("\nTesting critique aggregation...");

  const aggregated = aggregateCritiques(verdicts);

  logResult({
    testName: "Aggregate Critiques - Has Issues",
    passed: Array.isArray(aggregated.issues),
    message: `${aggregated.issues.length} prioritized issues`,
  });

  logResult({
    testName: "Aggregate Critiques - Limited to 5",
    passed: aggregated.issues.length <= 5,
    message:
      aggregated.issues.length <= 5
        ? "Correctly limited to max 5 issues"
        : `Too many issues: ${aggregated.issues.length}`,
  });

  logResult({
    testName: "Aggregate Critiques - Has Summary",
    passed: typeof aggregated.summary === "string" && aggregated.summary.length > 0,
    message: aggregated.summary,
  });

  if (aggregated.issues.length > 0) {
    const firstIssue = aggregated.issues[0];
    const hasRequiredFields =
      typeof firstIssue.dimension === "string" &&
      typeof firstIssue.issue === "string" &&
      typeof firstIssue.suggestedFix === "string" &&
      typeof firstIssue.priority === "string";

    logResult({
      testName: "Aggregate Critiques - Issue Structure",
      passed: hasRequiredFields,
      message: hasRequiredFields
        ? "Issues have required fields (dimension, issue, suggestedFix, priority)"
        : "Issues missing required fields",
    });
  }
}

async function runAllTests(): Promise<void> {
  console.log("=".repeat(60));
  console.log("CONSENSUS SCORING SYSTEM TESTS");
  console.log("=".repeat(60));

  const brief = loadSampleBrief();
  log(`Loaded sample brief: "${brief.question.substring(0, 50)}..."\n`);

  // Test 1: Parallel evaluators with real API calls
  const consensusInput = await testParallelEvaluators(brief);

  if (consensusInput) {
    // Test 2: Discussion round with real API calls
    const revisedVerdicts = await testDiscussionRound(consensusInput);

    if (revisedVerdicts) {
      // Test 3: Final score calculation (no API calls)
      testFinalScoreCalculation(revisedVerdicts);

      // Test 4: Aggregate critiques (no API calls)
      testAggregateCritiques(revisedVerdicts);
    }
  }

  // Test 5: Disagreement detection with artificial divergent scores (no API calls)
  testDisagreementDetectionWithDivergentScores();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${failed}/${total}`);

  if (failed > 0) {
    console.log("\nFailed Tests:");
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - ${r.testName}: ${r.message}`);
    }
  }

  console.log("=".repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error("Test runner failed:", error);
  process.exit(1);
});
