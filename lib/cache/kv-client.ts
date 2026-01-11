/**
 * Vercel KV Client
 * 
 * Provides a unified caching interface with:
 * - Vercel KV for production
 * - In-memory fallback for local development
 */

import { kv } from "@vercel/kv";

export interface KVClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

class VercelKVClient implements KVClient {
  async get<T>(key: string): Promise<T | null> {
    return kv.get<T>(key);
  }

  async set<T>(key: string, value: T, options?: { ex?: number }): Promise<void> {
    if (options?.ex) {
      await kv.set(key, value, { ex: options.ex });
    } else {
      await kv.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await kv.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return kv.keys(pattern);
  }
}

class InMemoryKV implements KVClient {
  private store = new Map<string, { value: unknown; expiresAt: number | null }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: { ex?: number }): Promise<void> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    const matchingKeys: string[] = [];
    
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        const entry = this.store.get(key);
        if (entry && (!entry.expiresAt || Date.now() <= entry.expiresAt)) {
          matchingKeys.push(key);
        }
      }
    }
    
    return matchingKeys;
  }
}

function createKVClient(): KVClient {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    console.log("[Cache] Using Vercel KV");
    return new VercelKVClient();
  }
  
  console.log("[Cache] Using in-memory cache (development mode)");
  return new InMemoryKV();
}

export const kvClient = createKVClient();

export async function isHealthy(): Promise<boolean> {
  try {
    const testKey = "__health_check__";
    await kvClient.set(testKey, "ok", { ex: 10 });
    const value = await kvClient.get<string>(testKey);
    await kvClient.del(testKey);
    return value === "ok";
  } catch (error) {
    console.error("[Cache] Health check failed:", error);
    return false;
  }
}
