import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy';

interface ServiceHealth {
  status: ServiceStatus;
  latencyMs?: number;
  error?: string;
}

interface HealthCheckResponse {
  status: ServiceStatus;
  services: {
    supabase: ServiceHealth;
  };
  cached: boolean;
  checkedAt: string;
}

let cachedResult: { response: HealthCheckResponse; checkedAt: number } | null = null;
const CACHE_DURATION_MS = 30000; // 30 seconds

async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      status: 'unhealthy',
      error: 'Supabase configuration missing',
    };
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Use a simple query to check connectivity
    const { error } = await supabase.from('briefs').select('id').limit(1);
    
    const latencyMs = Date.now() - startTime;

    if (error) {
      // Check for connection-specific errors
      const errorMessage = error.message?.toLowerCase() || '';
      const isConnectionError = 
        errorMessage.includes('connection') ||
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('econnrefused');

      return {
        status: isConnectionError ? 'unhealthy' : 'degraded',
        latencyMs,
        error: error.message,
      };
    }

    // Consider high latency as degraded
    if (latencyMs > 5000) {
      return {
        status: 'degraded',
        latencyMs,
        error: 'High latency detected',
      };
    }

    return {
      status: 'healthy',
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return {
      status: 'unhealthy',
      latencyMs,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

function determineOverallStatus(services: { supabase: ServiceHealth }): ServiceStatus {
  const statuses = Object.values(services).map(s => s.status);
  
  if (statuses.every(s => s === 'healthy')) {
    return 'healthy';
  }
  
  if (statuses.some(s => s === 'unhealthy')) {
    return 'unhealthy';
  }
  
  return 'degraded';
}

export async function GET() {
  const now = Date.now();

  if (cachedResult && (now - cachedResult.checkedAt) < CACHE_DURATION_MS) {
    return NextResponse.json({
      ...cachedResult.response,
      cached: true,
    });
  }

  const supabaseHealth = await checkSupabaseHealth();

  const services = {
    supabase: supabaseHealth,
  };

  const response: HealthCheckResponse = {
    status: determineOverallStatus(services),
    services,
    cached: false,
    checkedAt: new Date().toISOString(),
  };

  cachedResult = { response, checkedAt: now };

  return NextResponse.json(response);
}
