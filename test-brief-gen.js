// Quick test to generate a brief and check summaries
const { generateBrief } = require('./lib/agents/langgraph-orchestrator.ts');

async function test() {
  try {
    console.log('Testing brief generation...');
    const result = await generateBrief("What is democracy?");
    console.log('\n=== RESULT ===');
    console.log('Summaries keys:', Object.keys(result.summaries || {}));
    console.log('Summaries:', JSON.stringify(result.summaries, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
