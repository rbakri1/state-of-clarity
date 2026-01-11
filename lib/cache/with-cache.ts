import { kv } from "./kv-client";

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
    console.error(`[Cache] Error reading key "${key}":`, error);
  }

  const result = await fn();

  try {
    await kv.set(key, result, { ex: ttlSeconds });
  } catch (error) {
    console.error(`[Cache] Error writing key "${key}":`, error);
  }

  return result;
}
