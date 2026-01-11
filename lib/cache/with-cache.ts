import { kv } from "./kv-client";

function logCacheError(operation: string, key: string, error: unknown): void {
  console.error(`[Cache] Error ${operation} key "${key}":`, error);
  // Sentry integration for cache failures (epic 4.1)
  // When Sentry is installed, uncomment:
  // Sentry.captureException(error, {
  //   tags: { component: 'cache', operation },
  //   extra: { key }
  // });
  console.log(`[Sentry] Would report cache ${operation} error for key "${key}"`);
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
  } catch (error) {
    logCacheError("writing", key, error);
  }

  return result;
}
