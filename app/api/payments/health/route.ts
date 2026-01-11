import { NextResponse } from 'next/server';
import { checkStripeHealth } from '@/lib/stripe/safe-stripe-call';

let cachedResult: { healthy: boolean; checkedAt: number } | null = null;
const CACHE_DURATION_MS = 30000; // 30 seconds

export async function GET() {
  const now = Date.now();
  
  if (cachedResult && (now - cachedResult.checkedAt) < CACHE_DURATION_MS) {
    return NextResponse.json({ 
      healthy: cachedResult.healthy,
      cached: true,
    });
  }
  
  const healthy = await checkStripeHealth();
  
  cachedResult = { healthy, checkedAt: now };
  
  return NextResponse.json({ 
    healthy,
    cached: false,
  });
}
