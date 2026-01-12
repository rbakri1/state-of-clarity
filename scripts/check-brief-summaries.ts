/**
 * Script to check if any briefs in the database have incorrect summary structure
 * Run with: npx tsx scripts/check-brief-summaries.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBriefSummaries() {
  console.log("🔍 Checking briefs for incorrect summary structure...\n");

  const { data: briefs, error } = await supabase
    .from("briefs")
    .select("id, question, summaries")
    .limit(100);

  if (error) {
    console.error("❌ Error fetching briefs:", error);
    return;
  }

  if (!briefs || briefs.length === 0) {
    console.log("✅ No briefs found in database.");
    return;
  }

  console.log(`📊 Found ${briefs.length} briefs in database.\n`);

  const expectedKeys = ["child", "teen", "undergrad", "postdoc"];
  const oldKeys = ["simple", "standard", "advanced"];

  const briefsWithIssues: any[] = [];

  for (const brief of briefs) {
    const summaryKeys = Object.keys(brief.summaries || {});
    const hasOldKeys = oldKeys.some(key => summaryKeys.includes(key));
    const missingKeys = expectedKeys.filter(key => !summaryKeys.includes(key));

    if (hasOldKeys || missingKeys.length > 0) {
      briefsWithIssues.push({
        id: brief.id,
        question: brief.question,
        currentKeys: summaryKeys,
        hasOldKeys,
        missingKeys,
      });
    }
  }

  if (briefsWithIssues.length === 0) {
    console.log("✅ All briefs have correct summary structure!");
  } else {
    console.log(`⚠️  Found ${briefsWithIssues.length} briefs with incorrect structure:\n`);

    for (const brief of briefsWithIssues) {
      console.log(`Brief ID: ${brief.id}`);
      console.log(`Question: ${brief.question.substring(0, 60)}...`);
      console.log(`Current keys: ${brief.currentKeys.join(", ")}`);
      if (brief.hasOldKeys) {
        console.log(`❌ Has old keys (simple/standard/advanced)`);
      }
      if (brief.missingKeys.length > 0) {
        console.log(`❌ Missing keys: ${brief.missingKeys.join(", ")}`);
      }
      console.log();
    }

    console.log("\n⚠️  These briefs need to be regenerated or their summaries need to be migrated.");
  }
}

checkBriefSummaries().catch(console.error);
