/**
 * Check all briefs in the database for required fields completeness
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface BriefCheck {
  id: string;
  question: string;
  missingFields: string[];
  issues: string[];
}

async function checkBriefs() {
  console.log("🔍 Fetching all briefs from database...\n");

  const { data: briefs, error } = await supabase
    .from("briefs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching briefs:", error);
    process.exit(1);
  }

  if (!briefs || briefs.length === 0) {
    console.log("No briefs found in the database.");
    return;
  }

  console.log(`Found ${briefs.length} briefs in the database.\n`);
  console.log("=" .repeat(80));

  const results: BriefCheck[] = [];

  for (const brief of briefs) {
    const check: BriefCheck = {
      id: brief.id,
      question: brief.question?.slice(0, 60) + (brief.question?.length > 60 ? "..." : ""),
      missingFields: [],
      issues: [],
    };

    // Check required fields
    if (!brief.question || brief.question.trim() === "") {
      check.missingFields.push("question");
    }

    if (!brief.narrative || brief.narrative.trim() === "") {
      check.missingFields.push("narrative");
    }

    // Check summaries
    if (!brief.summaries || Object.keys(brief.summaries).length === 0) {
      check.missingFields.push("summaries (empty)");
    } else {
      const requiredLevels = ["child", "teen", "undergrad", "postdoc"];
      const missingSummaries = requiredLevels.filter(
        level => !brief.summaries[level] || brief.summaries[level].trim() === ""
      );
      if (missingSummaries.length > 0) {
        check.issues.push(`Missing reading levels: ${missingSummaries.join(", ")}`);
      }
    }

    // Check structured_data
    if (!brief.structured_data) {
      check.missingFields.push("structured_data");
    } else {
      const sd = brief.structured_data;
      if (!sd.definitions || sd.definitions.length === 0) {
        check.issues.push("No definitions");
      }
      if (!sd.factors || sd.factors.length === 0) {
        check.issues.push("No factors");
      }
    }

    // Check clarity score
    if (brief.clarity_score === null || brief.clarity_score === undefined) {
      check.issues.push("No clarity_score");
    }

    // Check clarity critique
    if (!brief.clarity_critique) {
      check.issues.push("No clarity_critique");
    } else {
      const cc = brief.clarity_critique;
      if (!cc.breakdown || Object.keys(cc.breakdown).length === 0) {
        check.issues.push("Empty clarity breakdown");
      }
    }

    // Check sources
    // We need to query brief_sources separately
    const { data: sources } = await supabase
      .from("brief_sources")
      .select("sources(*)")
      .eq("brief_id", brief.id);

    if (!sources || sources.length === 0) {
      check.issues.push("No sources linked");
    }

    results.push(check);
  }

  // Print results
  let completeCount = 0;
  let incompleteCount = 0;

  for (const result of results) {
    const hasIssues = result.missingFields.length > 0 || result.issues.length > 0;
    
    if (hasIssues) {
      incompleteCount++;
      console.log(`\n❌ INCOMPLETE: ${result.question}`);
      console.log(`   ID: ${result.id}`);
      if (result.missingFields.length > 0) {
        console.log(`   Missing: ${result.missingFields.join(", ")}`);
      }
      if (result.issues.length > 0) {
        console.log(`   Issues: ${result.issues.join("; ")}`);
      }
    } else {
      completeCount++;
      console.log(`\n✅ COMPLETE: ${result.question}`);
      console.log(`   ID: ${result.id}`);
    }
  }

  console.log("\n" + "=" .repeat(80));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total briefs: ${briefs.length}`);
  console.log(`   Complete: ${completeCount}`);
  console.log(`   Incomplete: ${incompleteCount}`);
  console.log();
}

checkBriefs().catch(console.error);
