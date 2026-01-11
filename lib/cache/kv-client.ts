/**
 * Vercel KV Client
 *
 * Provides a unified caching interface with:
 * - Vercel KV for production
 * - In-memory fallback for local development
 * - Health check capabilities
 * - Graceful degradation
 */

import { kv as vercelKv } from "@vercel/kv";

interface KVClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  isHealthy(): Promise<boolean>;
}

class InMemoryKV implements KVClient {
  private store: Map<string, { value: unknown; expiresAt?: number }> =
    new Map();

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(
    key: string,
    value: T,
    options?: { ex?: number }
  ): Promise<void> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
    );
    return Array.from(this.store.keys()).filter((k) => regex.test(k));
  }
}

class VercelKVClient implements KVClient {
  async isHealthy(): Promise<boolean> {
    try {
      await vercelKv.ping();
      return true;
    } catch (error) {
      console.error("[Cache Health] Vercel KV unhealthy:", error);
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    return vercelKv.get<T>(key);
  }

  async set<T>(
    key: string,
    value: T,
    options?: { ex?: number }
  ): Promise<void> {
    if (options?.ex) {
      await vercelKv.set(key, value, { ex: options.ex });
    } else {
      await vercelKv.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await vercelKv.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return vercelKv.keys(pattern);
  }
}

const inMemoryKv = new InMemoryKV();

function isVercelKVConfigured(): boolean {
  return !!(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  );
}

export const kv: KVClient = isVercelKVConfigured()
  ? new VercelKVClient()
  : inMemoryKv;

// Also export as kvClient for backwards compatibility
export const kvClient = kv;

export function isUsingInMemoryCache(): boolean {
  return !isVercelKVConfigured();
}

export async function isHealthy(): Promise<boolean> {
  return kv.isHealthy();
}
