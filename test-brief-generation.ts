/**
 * Test Brief Generation
 *
 * This script directly tests the brief generation orchestrator
 * to diagnose where the failure is occurring.
 *
 * Usage: npx tsx test-brief-generation.ts
 */

import { generateBrief } from "./lib/agents/langgraph-orchestrator";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testBriefGeneration() {
  console.log("🧪 Testing Brief Generation\n");
  console.log("Environment Check:");
  console.log("  ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✓ Set" : "✗ NOT SET");
  console.log("  TAVILY_API_KEY:", process.env.TAVILY_API_KEY ? "✓ Set" : "✗ NOT SET");
  console.log("\n" + "=".repeat(60) + "\n");

  const testQuestion = "Should the UK adopt a 4-day work week?";
  console.log(`📝 Test Question: "${testQuestion}"\n`);

  try {
    console.log("🚀 Starting brief generation...\n");
    const result = await generateBrief(testQuestion);

    console.log("\n" + "=".repeat(60));
    console.log("✅ GENERATION COMPLETED");
    console.log("=".repeat(60) + "\n");

    console.log("📊 Results:");
    console.log("  - Classification:", result.classification?.domain || "N/A");
    console.log("  - Sources found:", result.sources?.length || 0);
    console.log("  - Structure generated:", !!result.structure);
    console.log("  - Narrative generated:", !!result.narrative);
    console.log("  - Reconciliation done:", !!result.reconciliation);
    console.log("\n📚 Summaries Generated:");
    console.log("  - Child:", result.summaries?.child ? `✓ (${result.summaries.child.length} chars)` : "✗ MISSING");
    console.log("  - Teen:", result.summaries?.teen ? `✓ (${result.summaries.teen.length} chars)` : "✗ MISSING");
    console.log("  - Undergrad:", result.summaries?.undergrad ? `✓ (${result.summaries.undergrad.length} chars)` : "✗ MISSING");
    console.log("  - Postdoc:", result.summaries?.postdoc ? `✓ (${result.summaries.postdoc.length} chars)` : "✗ MISSING");

    console.log("\n📈 Clarity Score:", result.clarityScore?.overall || "N/A");
    console.log("❌ Error:", result.error || "None");

    if (result.error) {
      console.log("\n🔴 GENERATION FAILED");
      console.log("Error:", result.error);
      process.exit(1);
    }

    if (!result.summaries || Object.keys(result.summaries).length === 0) {
      console.log("\n⚠️  WARNING: No summaries were generated!");
      console.log("This is the issue causing brief generation to fail.");
      process.exit(1);
    }

    console.log("\n✅ All checks passed!");
    process.exit(0);

  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ UNEXPECTED ERROR");
    console.error("=".repeat(60));
    console.error(error);
    process.exit(1);
  }
}

testBriefGeneration();
