/**
 * Cache Invalidation Utility
 *
 * Functions to invalidate cached data when briefs are updated.
 */

import { kv } from "./kv-client";

export async function invalidateCache(key: string): Promise<void> {
  try {
    await kv.del(key);
    console.log(`[Cache] INVALIDATED: ${key}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating key "${key}":`, error);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await kv.keys(pattern);
    if (keys.length === 0) {
      console.log(`[Cache] No keys matched pattern: ${pattern}`);
      return;
    }

    for (const key of keys) {
      await kv.del(key);
    }
    console.log(`[Cache] INVALIDATED ${keys.length} keys matching: ${pattern}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating pattern "${pattern}":`, error);
  }
}
