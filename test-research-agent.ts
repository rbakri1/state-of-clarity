/**
 * Test script for the Research Agent
 * Run with: npx tsx test-research-agent.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local FIRST (with override to ensure it loads)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { researchAgent } from './lib/agents/research-agent';

async function testResearchAgent() {
  console.log('🔬 Testing Research Agent...\n');

  const question = "Should the UK adopt a 4-day work week?";
  console.log(`Question: "${question}"\n`);

  try {
    const sources = await researchAgent(question);

    console.log(`✅ Found ${sources.length} sources\n`);

    // Show first 3 sources
    sources.slice(0, 3).forEach((source, i) => {
      console.log(`\n📄 Source ${i + 1}:`);
      console.log(`   Title: ${source.title}`);
      console.log(`   URL: ${source.url}`);
      console.log(`   Publisher: ${source.publisher}`);
      console.log(`   Political Lean: ${source.political_lean}`);
      console.log(`   Credibility: ${source.credibility_score}/10`);
      console.log(`   Relevance: ${source.relevance_score.toFixed(2)}`);
    });

    // Show political diversity
    const leanCounts = sources.reduce((acc, s) => {
      acc[s.political_lean] = (acc[s.political_lean] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n\n📊 Political Diversity:');
    Object.entries(leanCounts).forEach(([lean, count]) => {
      const percentage = ((count / sources.length) * 100).toFixed(0);
      console.log(`   ${lean}: ${count} sources (${percentage}%)`);
    });

    console.log('\n✅ Research Agent test complete!');

  } catch (error) {
    console.error('❌ Error testing research agent:', error);
    process.exit(1);
  }
}

testResearchAgent();
