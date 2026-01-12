/**
 * Check agent execution logs for summary agents
 * Run with: npx tsx scripts/check-agent-logs.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAgentLogs() {
  console.log("🔍 Checking agent execution logs...\n");

  // Get logs for summary agents
  const { data: logs, error } = await supabase
    .from("agent_execution_logs")
    .select("*")
    .or("agent_name.like.%Summary%,agent_name.like.%summary%")
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("❌ Error fetching logs:", error);
    return;
  }

  if (!logs || logs.length === 0) {
    console.log("⚠️  No summary agent logs found in database.");
    return;
  }

  console.log(`📊 Found ${logs.length} summary agent logs:\n`);

  const failedLogs = logs.filter(log => log.status === 'failed');
  const successLogs = logs.filter(log => log.status === 'completed');

  console.log(`✅ Successful: ${successLogs.length}`);
  console.log(`❌ Failed: ${failedLogs.length}\n`);

  if (failedLogs.length > 0) {
    console.log("Failed agent executions:");
    for (const log of failedLogs.slice(0, 10)) {
      console.log(`\n  Agent: ${log.agent_name}`);
      console.log(`  Brief ID: ${log.brief_id}`);
      console.log(`  Error: ${log.error_message || 'Unknown error'}`);
      console.log(`  Started: ${new Date(log.started_at).toLocaleString()}`);
    }
  }

  // Group by brief and show which summaries were generated
  const briefLogs = logs.reduce((acc, log) => {
    if (!log.brief_id) return acc;
    if (!acc[log.brief_id]) acc[log.brief_id] = [];
    acc[log.brief_id].push(log);
    return acc;
  }, {} as Record<string, any[]>);

  console.log(`\n\n📈 Summary generation by brief:\n`);
  for (const [briefId, briefLogs] of Object.entries(briefLogs).slice(0, 5)) {
    const summaryAgents = briefLogs.filter(l => l.agent_name.toLowerCase().includes('summary'));
    console.log(`Brief ${briefId.substring(0, 8)}...:`);
    for (const log of summaryAgents) {
      const status = log.status === 'completed' ? '✅' : log.status === 'failed' ? '❌' : '⏳';
      console.log(`  ${status} ${log.agent_name} (${log.duration_ms}ms)`);
    }
  }
}

checkAgentLogs().catch(console.error);
