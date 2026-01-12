/**
 * Seed sample briefs into the database
 * 
 * Run with: npx tsx scripts/seed-sample-briefs.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SAMPLE_BRIEFS_DIR = path.join(process.cwd(), "sample-briefs");

// Map of sample brief files to their canonical IDs for the database
const BRIEF_FILES = [
  { file: "what-is-a-state.json", id: "what-is-a-state" },
  { file: "uk-four-day-week.json", id: "uk-four-day-week" },
  { file: "medicare-for-all.json", id: "medicare-for-all" },
  { file: "uk-ban-conversion-therapy.json", id: "uk-ban-conversion-therapy" },
  { file: "uk-mandatory-voting.json", id: "uk-mandatory-voting" },
  { file: "uk-rent-controls.json", id: "uk-rent-controls" },
  { file: "uk-scotland-independence-economics.json", id: "scottish-independence-economics" },
];

async function seedBriefs() {
  console.log("🌱 Seeding sample briefs into database...\n");

  for (const { file, id } of BRIEF_FILES) {
    const filePath = path.join(SAMPLE_BRIEFS_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} - file not found`);
      continue;
    }

    const briefData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Check if brief already exists
    const { data: existing } = await supabase
      .from("briefs")
      .select("id")
      .eq("question", briefData.question)
      .single();

    if (existing) {
      // Brief exists - check if it needs sources added
      await addSourcesToExistingBrief(existing.id, briefData.sources || []);
      console.log(`⏭️  "${briefData.question.slice(0, 50)}..." already exists, checked sources`);
      continue;
    }

    // Extract tags from metadata or create default ones
    const tags = briefData.metadata?.tags || extractTagsFromQuestion(briefData.question);

    // Prepare the brief for insertion
    const briefToInsert = {
      question: briefData.question,
      version: briefData.version || 1,
      user_id: null, // System-generated showcase brief
      summaries: briefData.summaries,
      structured_data: briefData.structured_data,
      narrative: briefData.narrative || "",
      posit: briefData.posit || null,
      historical_summary: briefData.historical_summary || null,
      foundational_principles: briefData.foundational_principles || null,
      clarity_score: briefData.clarity_score,
      clarity_critique: briefData.clarity_critique || null,
      metadata: {
        tags,
        sample_brief: true, // Mark as sample brief
      },
      is_public: true,
      view_count: 0,
    };

    const { data: insertedBrief, error } = await supabase
      .from("briefs")
      .insert(briefToInsert)
      .select("id")
      .single();

    if (error) {
      console.error(`❌ Failed to insert "${briefData.question.slice(0, 50)}...":`, error.message);
    } else {
      console.log(`✅ Inserted: "${briefData.question.slice(0, 50)}..."`);
      
      // Now add sources to the sources table and link via brief_sources
      if (insertedBrief && briefData.sources?.length > 0) {
        await addSourcesToExistingBrief(insertedBrief.id, briefData.sources);
      }
    }
  }

  console.log("\n🎉 Done!");
}

/**
 * Add sources to a brief using the sources and brief_sources tables
 */
async function addSourcesToExistingBrief(briefId: string, sources: any[]): Promise<void> {
  if (!sources || sources.length === 0) {
    return;
  }

  // Check if this brief already has sources linked
  const { data: existingSources } = await supabase
    .from("brief_sources")
    .select("source_id")
    .eq("brief_id", briefId)
    .limit(1);

  if (existingSources && existingSources.length > 0) {
    console.log(`   ℹ️  Brief ${briefId.slice(0, 8)}... already has sources linked`);
    return;
  }

  console.log(`   📚 Adding ${sources.length} sources to brief ${briefId.slice(0, 8)}...`);

  // Upsert sources into the sources table
  const sourceRecords = sources.map((source) => ({
    url: source.url,
    title: source.title,
    author: source.author || null,
    publisher: source.publisher || null,
    publication_date: source.publication_date || null,
    source_type: source.source_type || null,
    political_lean: source.political_lean || null,
    credibility_score: source.credibility_score || null,
    excerpt: source.excerpt || source.content?.slice(0, 500) || null,
    full_content: source.content || null,
  }));

  const { data: upsertedSources, error: sourcesError } = await supabase
    .from("sources")
    .upsert(sourceRecords, { onConflict: "url" })
    .select("id, url");

  if (sourcesError) {
    console.error(`   ❌ Failed to upsert sources:`, sourcesError.message);
    return;
  }

  // Create URL -> ID map
  const urlToIdMap = new Map<string, string>();
  for (const source of upsertedSources || []) {
    urlToIdMap.set(source.url, source.id);
  }

  // Create junction table records
  const junctionRecords = sources
    .map((source, index) => ({
      brief_id: briefId,
      source_id: urlToIdMap.get(source.url),
      display_order: index + 1,
    }))
    .filter((record) => record.source_id);

  if (junctionRecords.length > 0) {
    const { error: junctionError } = await supabase
      .from("brief_sources")
      .insert(junctionRecords);

    if (junctionError) {
      console.error(`   ❌ Failed to link sources:`, junctionError.message);
    } else {
      console.log(`   ✅ Linked ${junctionRecords.length} sources`);
    }
  }
}

function extractTagsFromQuestion(question: string): string[] {
  const tags: string[] = [];
  
  // Simple keyword extraction
  if (question.toLowerCase().includes("uk")) tags.push("UK Policy");
  if (question.toLowerCase().includes("us") || question.toLowerCase().includes("america")) tags.push("US Policy");
  if (question.toLowerCase().includes("healthcare") || question.toLowerCase().includes("medicare")) tags.push("Healthcare");
  if (question.toLowerCase().includes("voting") || question.toLowerCase().includes("election")) tags.push("Democracy");
  if (question.toLowerCase().includes("tax") || question.toLowerCase().includes("economic")) tags.push("Economics");
  if (question.toLowerCase().includes("rent") || question.toLowerCase().includes("housing")) tags.push("Housing");
  if (question.toLowerCase().includes("scotland") || question.toLowerCase().includes("independence")) tags.push("Constitutional");
  if (question.toLowerCase().includes("work week") || question.toLowerCase().includes("labor")) tags.push("Labor Policy");
  if (question.toLowerCase().includes("state")) tags.push("Political Philosophy");
  if (question.toLowerCase().includes("therapy") || question.toLowerCase().includes("lgbtq")) tags.push("Social Policy");
  
  return tags.length > 0 ? tags : ["Policy"];
}

seedBriefs().catch(console.error);
