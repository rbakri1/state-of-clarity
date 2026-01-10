/**
 * Quality Gate Test Script
 *
 * Tests the quality gate system with various scenarios:
 * 1. High score (8.5) -> publishable, no warning
 * 2. Acceptable score (7.2) -> publishable with warning
 * 3. Failed score (5.5) -> not publishable, refund required
 * 4. Retry queue operations (add, retrieve, mark complete)
 */

import {
  QualityTier,
  getQualityTier,
  createQualityGateResult,
  type QualityGateResult,
  type RetryParams,
} from "./lib/types/quality-gate";
import { generateRetryParams } from "./lib/services/retry-queue-service";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean, expectedMessage: string): void {
  try {
    const passed = fn();
    results.push({
      name,
      passed,
      message: passed ? "✓ PASSED" : `✗ FAILED: ${expectedMessage}`,
    });
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: `✗ ERROR: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

function assertEqual<T>(actual: T, expected: T): boolean {
  return actual === expected;
}

function runTests(): void {
  console.log("\n=== Quality Gate Tests ===\n");

  // Test Scenario 1: High quality score (8.5)
  console.log("--- Scenario 1: High Quality Score (8.5) ---");
  
  test(
    "Score 8.5 should return HIGH tier",
    () => assertEqual(getQualityTier(8.5), QualityTier.HIGH),
    "Expected HIGH tier for score 8.5"
  );

  const highResult: QualityGateResult = createQualityGateResult(8.5, 1);
  
  test(
    "Score 8.5 should be publishable",
    () => assertEqual(highResult.publishable, true),
    "Expected publishable=true for score 8.5"
  );

  test(
    "Score 8.5 should NOT have warning badge",
    () => assertEqual(highResult.warningBadge, false),
    "Expected warningBadge=false for score 8.5"
  );

  test(
    "Score 8.5 should NOT require refund",
    () => assertEqual(highResult.refundRequired, false),
    "Expected refundRequired=false for score 8.5"
  );

  test(
    "Score 8.5 should have correct final score",
    () => assertEqual(highResult.finalScore, 8.5),
    "Expected finalScore=8.5"
  );

  // Test Scenario 2: Acceptable quality score (7.2)
  console.log("\n--- Scenario 2: Acceptable Quality Score (7.2) ---");

  test(
    "Score 7.2 should return ACCEPTABLE tier",
    () => assertEqual(getQualityTier(7.2), QualityTier.ACCEPTABLE),
    "Expected ACCEPTABLE tier for score 7.2"
  );

  const acceptableResult: QualityGateResult = createQualityGateResult(7.2, 2);

  test(
    "Score 7.2 should be publishable",
    () => assertEqual(acceptableResult.publishable, true),
    "Expected publishable=true for score 7.2"
  );

  test(
    "Score 7.2 SHOULD have warning badge",
    () => assertEqual(acceptableResult.warningBadge, true),
    "Expected warningBadge=true for score 7.2"
  );

  test(
    "Score 7.2 should NOT require refund",
    () => assertEqual(acceptableResult.refundRequired, false),
    "Expected refundRequired=false for score 7.2"
  );

  test(
    "Score 7.2 should track attempts correctly",
    () => assertEqual(acceptableResult.attempts, 2),
    "Expected attempts=2"
  );

  // Test Scenario 3: Failed quality score (5.5)
  console.log("\n--- Scenario 3: Failed Quality Score (5.5) ---");

  test(
    "Score 5.5 should return FAILED tier",
    () => assertEqual(getQualityTier(5.5), QualityTier.FAILED),
    "Expected FAILED tier for score 5.5"
  );

  const failedResult: QualityGateResult = createQualityGateResult(5.5, 3);

  test(
    "Score 5.5 should NOT be publishable",
    () => assertEqual(failedResult.publishable, false),
    "Expected publishable=false for score 5.5"
  );

  test(
    "Score 5.5 should NOT have warning badge",
    () => assertEqual(failedResult.warningBadge, false),
    "Expected warningBadge=false for score 5.5"
  );

  test(
    "Score 5.5 SHOULD require refund",
    () => assertEqual(failedResult.refundRequired, true),
    "Expected refundRequired=true for score 5.5"
  );

  // Test boundary conditions
  console.log("\n--- Boundary Condition Tests ---");

  test(
    "Score 8.0 (exactly) should return HIGH tier",
    () => assertEqual(getQualityTier(8.0), QualityTier.HIGH),
    "Expected HIGH tier for score 8.0"
  );

  test(
    "Score 7.99 should return ACCEPTABLE tier",
    () => assertEqual(getQualityTier(7.99), QualityTier.ACCEPTABLE),
    "Expected ACCEPTABLE tier for score 7.99"
  );

  test(
    "Score 6.0 (exactly) should return ACCEPTABLE tier",
    () => assertEqual(getQualityTier(6.0), QualityTier.ACCEPTABLE),
    "Expected ACCEPTABLE tier for score 6.0"
  );

  test(
    "Score 5.99 should return FAILED tier",
    () => assertEqual(getQualityTier(5.99), QualityTier.FAILED),
    "Expected FAILED tier for score 5.99"
  );

  // Test Scenario 4: Retry Queue Operations (using generateRetryParams)
  console.log("\n--- Scenario 4: Retry Queue Operations ---");

  const lowEvidenceParams: RetryParams = generateRetryParams(
    "Low evidence score detected"
  );
  test(
    "Low evidence failure should trigger increased source diversity",
    () => assertEqual(lowEvidenceParams.increasedSourceDiversity, true),
    "Expected increasedSourceDiversity=true for low evidence"
  );

  test(
    "Low evidence failure should request more sources",
    () => assertEqual(lowEvidenceParams.minSources, 10),
    "Expected minSources=10 for low evidence"
  );

  const lowObjectivityParams: RetryParams = generateRetryParams(
    "Content appears biased"
  );
  test(
    "Low objectivity failure should force opposing views",
    () => assertEqual(lowObjectivityParams.forceOpposingViews, true),
    "Expected forceOpposingViews=true for low objectivity"
  );

  test(
    "Low objectivity failure should use neutral persona",
    () => assertEqual(lowObjectivityParams.specialistPersona, "Neutral Analyst"),
    "Expected specialistPersona='Neutral Analyst' for low objectivity"
  );

  const lowClarityParams: RetryParams = generateRetryParams(
    "Content is unclear and confusing"
  );
  test(
    "Low clarity failure should provide adjusted prompts",
    () =>
      Array.isArray(lowClarityParams.adjustedPrompts) &&
      lowClarityParams.adjustedPrompts.length > 0,
    "Expected adjustedPrompts array for low clarity"
  );

  const genericFailureParams: RetryParams = generateRetryParams(
    "Quality score too low"
  );
  test(
    "Generic failure should trigger both source diversity and opposing views",
    () =>
      genericFailureParams.increasedSourceDiversity === true &&
      genericFailureParams.forceOpposingViews === true,
    "Expected both flags for generic failure"
  );

  // Print summary
  console.log("\n=== Test Summary ===\n");
  
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  
  results.forEach((result) => {
    console.log(`${result.message} - ${result.name}`);
  });

  console.log(`\nTotal: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  
  if (failed > 0) {
    console.log("\n❌ Some tests failed!");
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  }
}

// Run the tests
runTests();
