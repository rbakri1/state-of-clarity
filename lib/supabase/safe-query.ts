/**
 * Safe Supabase Query Wrapper
 *
 * Provides utilities for wrapping Supabase queries with:
 * - Error handling and connection error detection
 * - Duration tracking and slow query logging
 * - Sentry integration for error reporting
 * - Graceful degradation
 */

import * as Sentry from "@sentry/nextjs";

export interface SafeQueryResult<T> {
  data: T | null;
  error: Error | null;
  isConnectionError: boolean;
  duration?: number;
}

export interface SafeQueryOptions {
  queryName: string;
  table?: string;
  briefId?: string;
  userId?: string;
  additionalContext?: Record<string, unknown>;
  slowThresholdMs?: number;
  verySlowThresholdMs?: number;
}

const CONNECTION_ERROR_CODES = [
  "PGRST000", // Connection error
  "PGRST301", // Connection timeout
  "57P01", // Admin shutdown
  "57P02", // Crash shutdown
  "57P03", // Cannot connect now
  "08000", // Connection exception
  "08003", // Connection does not exist
  "08006", // Connection failure
];

const DEFAULT_SLOW_THRESHOLD_MS = 1000;
const DEFAULT_VERY_SLOW_THRESHOLD_MS = 2000;

function isConnectionError(error: { code?: string; message?: string }): boolean {
  if (error.code && CONNECTION_ERROR_CODES.includes(error.code)) {
    return true;
  }
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("connection") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("enotfound")
  );
}

/**
 * Log query performance based on duration thresholds.
 */
function logQueryPerformance(
  queryName: string,
  durationMs: number,
  slowThresholdMs: number,
  verySlowThresholdMs: number,
  error?: Error | null
): void {
  const roundedDuration = Math.round(durationMs);

  if (durationMs >= verySlowThresholdMs) {
    console.warn(
      `[Query VERY SLOW] ${queryName} took ${roundedDuration}ms (threshold: ${verySlowThresholdMs}ms)`
    );
    Sentry.captureMessage(`Slow database query: ${queryName}`, {
      level: "warning",
      tags: {
        type: "slow_query",
        query: queryName,
      },
      extra: {
        durationMs: roundedDuration,
        threshold: verySlowThresholdMs,
        error: error?.message,
      },
    });
  } else if (durationMs >= slowThresholdMs) {
    console.warn(
      `[Query SLOW] ${queryName} took ${roundedDuration}ms (threshold: ${slowThresholdMs}ms)`
    );
  }
}

/**
 * Execute a Supabase query safely with error handling, performance tracking, and Sentry logging
 */
export async function safeQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>,
  options: SafeQueryOptions
): Promise<SafeQueryResult<T>> {
  const {
    queryName,
    slowThresholdMs = DEFAULT_SLOW_THRESHOLD_MS,
    verySlowThresholdMs = DEFAULT_VERY_SLOW_THRESHOLD_MS,
  } = options;

  const startTime = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;

    if (result.error) {
      const connectionError = isConnectionError(result.error);

      Sentry.captureException(new Error(result.error.message), {
        tags: {
          component: "supabase",
          queryName: options.queryName,
          table: options.table || "unknown",
          isConnectionError: connectionError,
        },
        extra: {
          errorCode: result.error.code,
          briefId: options.briefId,
          userId: options.userId,
          duration,
          ...options.additionalContext,
        },
      });

      console.error(`[SafeQuery] ${options.queryName} failed:`, result.error.message);

      const error = new Error(
        connectionError
          ? "Database temporarily unavailable"
          : result.error.message
      );

      logQueryPerformance(queryName, duration, slowThresholdMs, verySlowThresholdMs, error);

      return {
        data: null,
        error,
        isConnectionError: connectionError,
        duration,
      };
    }

    logQueryPerformance(queryName, duration, slowThresholdMs, verySlowThresholdMs, null);

    return {
      data: result.data,
      error: null,
      isConnectionError: false,
      duration,
    };
  } catch (err) {
    const duration = performance.now() - startTime;
    const error = err instanceof Error ? err : new Error(String(err));
    const connectionError = isConnectionError({ message: error.message });

    Sentry.captureException(error, {
      tags: {
        component: "supabase",
        queryName: options.queryName,
        table: options.table || "unknown",
        isConnectionError: connectionError,
      },
      extra: {
        briefId: options.briefId,
        userId: options.userId,
        duration,
        ...options.additionalContext,
      },
    });

    console.error(`[SafeQuery] ${options.queryName} threw exception:`, error.message);

    logQueryPerformance(queryName, duration, slowThresholdMs, verySlowThresholdMs, error);

    return {
      data: null,
      error: new Error(
        connectionError
          ? "Database temporarily unavailable"
          : error.message
      ),
      isConnectionError: connectionError,
      duration,
    };
  }
}

/**
 * Execute multiple Supabase queries safely in parallel
 * Returns results in the same order as the input queries
 */
export async function safeQueryAll<T extends unknown[]>(
  queries: { [K in keyof T]: () => PromiseLike<{ data: T[K] | null; error: { message: string; code?: string } | null }> },
  optionsArray: SafeQueryOptions[]
): Promise<{ [K in keyof T]: SafeQueryResult<T[K]> }> {
  const results = await Promise.all(
    queries.map((queryFn, index) => safeQuery(queryFn, optionsArray[index]))
  );
  return results as { [K in keyof T]: SafeQueryResult<T[K]> };
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
