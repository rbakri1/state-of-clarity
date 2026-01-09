/**
 * Test if environment variables are loaded correctly
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 Checking environment variables...\n');

const tavily = process.env.TAVILY_API_KEY;
const anthropic = process.env.ANTHROPIC_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('TAVILY_API_KEY:', tavily ? `✅ Found (${tavily.substring(0, 15)}...)` : '❌ Not found');
console.log('ANTHROPIC_API_KEY:', anthropic ? `✅ Found (${anthropic.substring(0, 20)}...)` : '❌ Not found');
console.log('SUPABASE_URL:', supabaseUrl ? `✅ Found (${supabaseUrl})` : '❌ Not found');

if (!tavily || !anthropic || !supabaseUrl) {
  console.log('\n❌ Some environment variables are missing!');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables found!');
}
