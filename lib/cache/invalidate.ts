/**
 * Cache Invalidation Utility
 * 
 * Functions to invalidate cached data when briefs are updated.
 */

import { kvClient } from "./kv-client";

export async function invalidateCache(key: string): Promise<void> {
  try {
    await kvClient.del(key);
    console.log(`[Cache] INVALIDATE: ${key}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating ${key}:`, error);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await kvClient.keys(pattern);
    console.log(`[Cache] Found ${keys.length} keys matching pattern: ${pattern}`);
    
    for (const key of keys) {
      await kvClient.del(key);
      console.log(`[Cache] INVALIDATE: ${key}`);
    }
    
    console.log(`[Cache] INVALIDATE PATTERN: ${pattern} (${keys.length} keys deleted)`);
  } catch (error) {
    console.error(`[Cache] Error invalidating pattern ${pattern}:`, error);
  }
}
