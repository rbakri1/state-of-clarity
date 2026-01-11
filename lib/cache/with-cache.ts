/**
 * Cache Wrapper Utility
 *
 * Generic wrapper to cache any async function result.
 * Handles cache errors gracefully by falling back to direct fetch.
 * Includes connection error detection for better diagnostics.
 */

import { kv } from "./kv-client";

function logCacheError(operation: string, key: string, error: unknown): void {
  console.error(`[Cache] Error ${operation} key "${key}":`, error);
}

function isConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("etimedout") ||
    message.includes("socket hang up") ||
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("unavailable") ||
    message.includes("upstash")
  );
}

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    const cached = await kv.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }
    console.log(`[Cache] MISS: ${key}`);
  } catch (error) {
    logCacheError("reading", key, error);
    if (isConnectionError(error)) {
      console.log(`[Cache] Connection error detected, skipping cache for "${key}"`);
    }
  }

  const result = await fn();

  try {
    await kv.set(key, result, { ex: ttlSeconds });
    console.log(`[Cache] SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    logCacheError("writing", key, error);
  }

  return result;
}
