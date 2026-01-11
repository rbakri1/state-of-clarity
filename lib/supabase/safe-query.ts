/**
 * Safe Query Wrapper for Supabase
 *
 * Wraps database queries with:
 * - Duration tracking
 * - Slow query logging (>1000ms to console)
 * - Very slow query reporting (>2000ms to Sentry when available)
 */

// Import Sentry when available (epic 4.1 will add this)
// import * as Sentry from "@sentry/nextjs";

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  duration: number;
}

export interface SafeQueryOptions {
  queryName: string;
  slowThresholdMs?: number;
  verySlowThresholdMs?: number;
}

const DEFAULT_SLOW_THRESHOLD_MS = 1000;
const DEFAULT_VERY_SLOW_THRESHOLD_MS = 2000;

/**
 * Execute a database query with performance tracking.
 * Logs slow queries and reports very slow queries to Sentry.
 *
 * @param queryFn - The async function that executes the query
 * @param options - Configuration options including query name for logging
 * @returns The query result with data, error, and duration
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: SafeQueryOptions
): Promise<QueryResult<T>> {
  const {
    queryName,
    slowThresholdMs = DEFAULT_SLOW_THRESHOLD_MS,
    verySlowThresholdMs = DEFAULT_VERY_SLOW_THRESHOLD_MS,
  } = options;

  const startTime = performance.now();

  try {
    const { data, error } = await queryFn();
    const duration = performance.now() - startTime;

    logQueryPerformance(queryName, duration, slowThresholdMs, verySlowThresholdMs, error);

    if (error) {
      return {
        data: null,
        error: new Error(error.message || "Query failed"),
        duration,
      };
    }

    return { data, error: null, duration };
  } catch (error) {
    const duration = performance.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    logQueryPerformance(queryName, duration, slowThresholdMs, verySlowThresholdMs, err);

    return { data: null, error: err, duration };
  }
}

/**
 * Log query performance based on duration thresholds.
 */
function logQueryPerformance(
  queryName: string,
  durationMs: number,
  slowThresholdMs: number,
  verySlowThresholdMs: number,
  error?: any
): void {
  const roundedDuration = Math.round(durationMs);

  if (durationMs >= verySlowThresholdMs) {
    console.warn(
      `[Query VERY SLOW] ${queryName} took ${roundedDuration}ms (threshold: ${verySlowThresholdMs}ms)`
    );
    reportToSentry(queryName, roundedDuration, error);
  } else if (durationMs >= slowThresholdMs) {
    console.warn(
      `[Query SLOW] ${queryName} took ${roundedDuration}ms (threshold: ${slowThresholdMs}ms)`
    );
  }
}

/**
 * Report very slow queries to Sentry as performance issues.
 * Currently logs to console; will integrate with Sentry when epic 4.1 is complete.
 */
function reportToSentry(
  queryName: string,
  durationMs: number,
  error?: any
): void {
  // When Sentry is available (epic 4.1), uncomment:
  // Sentry.captureMessage(`Slow database query: ${queryName}`, {
  //   level: "warning",
  //   tags: {
  //     type: "slow_query",
  //     query: queryName,
  //   },
  //   extra: {
  //     durationMs,
  //     threshold: DEFAULT_VERY_SLOW_THRESHOLD_MS,
  //     error: error?.message,
  //   },
  // });

  // For now, log to console with Sentry-ready format
  console.error(`[Sentry] Performance issue - Slow query: ${queryName}`, {
    durationMs,
    threshold: DEFAULT_VERY_SLOW_THRESHOLD_MS,
    error: error?.message,
  });
}

/**
 * Simple wrapper for queries that only need duration tracking.
 * Returns only the data/error, logs performance internally.
 */
export async function trackedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  queryName: string
): Promise<{ data: T | null; error: any }> {
  const result = await safeQuery(queryFn, { queryName });
  return {
    data: result.data,
    error: result.error,
  };
}
