/**
 * Cache Wrapper Utility
 * 
 * Generic wrapper to cache any async function result.
 * Handles cache errors gracefully by falling back to direct fetch.
 */

import { kvClient } from "./kv-client";

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    const cached = await kvClient.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }
  } catch (error) {
    console.error(`[Cache] Error reading ${key}:`, error);
  }

  console.log(`[Cache] MISS: ${key}`);
  
  const result = await fn();

  try {
    await kvClient.set(key, result, { ex: ttlSeconds });
    console.log(`[Cache] SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error(`[Cache] Error writing ${key}:`, error);
  }

  return result;
}
