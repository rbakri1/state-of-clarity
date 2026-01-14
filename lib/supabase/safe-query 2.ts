/**
 * Safe Supabase Query Wrapper
 * 
 * Provides utilities for wrapping Supabase queries with error handling,
 * Sentry logging, and graceful degradation.
 */

import * as Sentry from "@sentry/nextjs";

export interface SafeQueryResult<T> {
  data: T | null;
  error: Error | null;
  isConnectionError: boolean;
}

export interface SafeQueryOptions {
  queryName: string;
  table?: string;
  briefId?: string;
  userId?: string;
  additionalContext?: Record<string, unknown>;
}

const CONNECTION_ERROR_CODES = [
  "PGRST000",  // Connection error
  "PGRST301",  // Connection timeout
  "57P01",     // Admin shutdown
  "57P02",     // Crash shutdown
  "57P03",     // Cannot connect now
  "08000",     // Connection exception
  "08003",     // Connection does not exist
  "08006",     // Connection failure
];

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
 * Execute a Supabase query safely with error handling and Sentry logging
 */
export async function safeQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>,
  options: SafeQueryOptions
): Promise<SafeQueryResult<T>> {
  try {
    const result = await queryFn();

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
          ...options.additionalContext,
        },
      });

      console.error(`[SafeQuery] ${options.queryName} failed:`, result.error.message);

      return {
        data: null,
        error: new Error(
          connectionError
            ? "Database temporarily unavailable"
            : result.error.message
        ),
        isConnectionError: connectionError,
      };
    }

    return {
      data: result.data,
      error: null,
      isConnectionError: false,
    };
  } catch (err) {
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
        ...options.additionalContext,
      },
    });

    console.error(`[SafeQuery] ${options.queryName} threw exception:`, error.message);

    return {
      data: null,
      error: new Error(
        connectionError
          ? "Database temporarily unavailable"
          : error.message
      ),
      isConnectionError: connectionError,
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
