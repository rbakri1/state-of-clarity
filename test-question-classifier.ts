/**
 * Test script for the Question Classifier
 * Run with: npx tsx test-question-classifier.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { classifyQuestion } from './lib/agents/question-classifier';
import type { QuestionClassification } from './lib/types/classification';

interface TestCase {
  question: string;
  expected: Partial<QuestionClassification>;
  description: string;
}

const testCases: TestCase[] = [
  // Domain diversity tests (5 diverse questions)
  {
    question: "What is the current UK inflation rate?",
    expected: { domain: "economics", controversyLevel: "low", questionType: "factual", temporalScope: "current" },
    description: "Economics - factual current data"
  },
  {
    question: "How do NHS waiting times compare to European healthcare systems?",
    expected: { domain: "healthcare", questionType: "comparative" },
    description: "Healthcare - comparative analysis"
  },
  {
    question: "Will climate change make UK coastal cities uninhabitable by 2100?",
    expected: { domain: "climate", temporalScope: "future" },
    description: "Climate - future projection"
  },
  {
    question: "What reforms did the 2012 Education Act introduce?",
    expected: { domain: "education", temporalScope: "historical" },
    description: "Education - historical question"
  },
  {
    question: "Should the UK increase defense spending to meet NATO targets?",
    expected: { domain: "defense", questionType: "opinion" },
    description: "Defense - opinion question"
  },

  // Controversy level tests
  {
    question: "Should UK adopt a 4-day work week?",
    expected: { controversyLevel: "medium" },
    description: "Controversy: medium - legitimate policy debate"
  },
  {
    question: "Should UK rejoin the EU?",
    expected: { controversyLevel: "high" },
    description: "Controversy: high - deeply divisive issue"
  },
  {
    question: "What is GDP?",
    expected: { controversyLevel: "low" },
    description: "Controversy: low - factual definition"
  },

  // Question type tests
  {
    question: "What is the definition of inflation?",
    expected: { questionType: "factual" },
    description: "Question type: factual"
  },
  {
    question: "Why did inflation rise sharply in 2022?",
    expected: { questionType: "analytical", temporalScope: "historical" },
    description: "Question type: analytical"
  },
  {
    question: "Should the Bank of England raise interest rates?",
    expected: { questionType: "opinion" },
    description: "Question type: opinion"
  },

  // Temporal scope tests
  {
    question: "What caused the 2008 financial crisis?",
    expected: { temporalScope: "historical", domain: "economics" },
    description: "Temporal: historical event"
  },
  {
    question: "What is the current unemployment rate in the UK?",
    expected: { temporalScope: "current" },
    description: "Temporal: current data"
  },
  {
    question: "Will AI replace most white-collar jobs by 2040?",
    expected: { temporalScope: "future", domain: "technology" },
    description: "Temporal: future prediction"
  },
];

async function runTests() {
  console.log('🔬 Testing Question Classifier...\n');
  console.log(`Running ${testCases.length} test cases\n`);
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.description}`);
    console.log(`   Question: "${testCase.question}"`);
    
    try {
      const result = await classifyQuestion(testCase.question);
      
      let testPassed = true;
      const mismatches: string[] = [];

      for (const [key, expectedValue] of Object.entries(testCase.expected)) {
        const actualValue = result[key as keyof QuestionClassification];
        if (actualValue !== expectedValue) {
          testPassed = false;
          mismatches.push(`${key}: expected "${expectedValue}", got "${actualValue}"`);
        }
      }

      if (testPassed) {
        console.log(`   ✅ PASSED`);
        console.log(`   Result: ${JSON.stringify(result)}`);
        passed++;
      } else {
        console.log(`   ❌ FAILED`);
        console.log(`   Result: ${JSON.stringify(result)}`);
        mismatches.forEach(m => console.log(`   ⚠️  ${m}`));
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review classifications above.`);
  }

  return { passed, failed };
}

runTests().catch(console.error);
