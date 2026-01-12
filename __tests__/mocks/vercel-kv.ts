/**
 * Vercel KV Mock
 *
 * Provides in-memory KV store for testing cache operations.
 */

import { vi } from 'vitest';

interface CacheEntry {
  value: any;
  expiry?: number; // Unix timestamp in ms
}

// In-memory cache store
const kvStore = new Map<string, CacheEntry>();

// Mock KV functions
export const kv = {
  get: vi.fn().mockImplementation(async <T = any>(key: string): Promise<T | null> => {
    const entry = kvStore.get(key);
    if (!entry) return null;

    // Check expiry
    if (entry.expiry && Date.now() > entry.expiry) {
      kvStore.delete(key);
      return null;
    }

    return entry.value as T;
  }),

  set: vi.fn().mockImplementation(async (
    key: string,
    value: any,
    options?: { ex?: number; px?: number; nx?: boolean; xx?: boolean }
  ): Promise<'OK' | null> => {
    const existing = kvStore.has(key);

    // Handle nx (only set if not exists) and xx (only set if exists)
    if (options?.nx && existing) return null;
    if (options?.xx && !existing) return null;

    let expiry: number | undefined;
    if (options?.ex) {
      expiry = Date.now() + options.ex * 1000;
    } else if (options?.px) {
      expiry = Date.now() + options.px;
    }

    kvStore.set(key, { value, expiry });
    return 'OK';
  }),

  del: vi.fn().mockImplementation(async (...keys: string[]): Promise<number> => {
    let deleted = 0;
    for (const key of keys) {
      if (kvStore.delete(key)) deleted++;
    }
    return deleted;
  }),

  exists: vi.fn().mockImplementation(async (...keys: string[]): Promise<number> => {
    let count = 0;
    for (const key of keys) {
      const entry = kvStore.get(key);
      if (entry && (!entry.expiry || Date.now() <= entry.expiry)) {
        count++;
      }
    }
    return count;
  }),

  expire: vi.fn().mockImplementation(async (key: string, seconds: number): Promise<number> => {
    const entry = kvStore.get(key);
    if (!entry) return 0;
    entry.expiry = Date.now() + seconds * 1000;
    return 1;
  }),

  ttl: vi.fn().mockImplementation(async (key: string): Promise<number> => {
    const entry = kvStore.get(key);
    if (!entry) return -2; // Key doesn't exist
    if (!entry.expiry) return -1; // No expiry
    const remaining = Math.ceil((entry.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }),

  keys: vi.fn().mockImplementation(async (pattern: string): Promise<string[]> => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const result: string[] = [];
    for (const [key, entry] of kvStore.entries()) {
      if (regex.test(key) && (!entry.expiry || Date.now() <= entry.expiry)) {
        result.push(key);
      }
    }
    return result;
  }),

  mget: vi.fn().mockImplementation(async <T = any>(...keys: string[]): Promise<(T | null)[]> => {
    const results: (T | null)[] = [];
    for (const key of keys) {
      const entry = kvStore.get(key);
      if (!entry || (entry.expiry && Date.now() > entry.expiry)) {
        results.push(null);
      } else {
        results.push(entry.value as T);
      }
    }
    return results;
  }),

  mset: vi.fn().mockImplementation(async (data: Record<string, any>): Promise<'OK'> => {
    for (const [key, value] of Object.entries(data)) {
      kvStore.set(key, { value });
    }
    return 'OK';
  }),

  incr: vi.fn().mockImplementation(async (key: string): Promise<number> => {
    const entry = kvStore.get(key);
    const current = entry ? (typeof entry.value === 'number' ? entry.value : parseInt(entry.value) || 0) : 0;
    const newValue = current + 1;
    kvStore.set(key, { value: newValue, expiry: entry?.expiry });
    return newValue;
  }),

  decr: vi.fn().mockImplementation(async (key: string): Promise<number> => {
    const entry = kvStore.get(key);
    const current = entry ? (typeof entry.value === 'number' ? entry.value : parseInt(entry.value) || 0) : 0;
    const newValue = current - 1;
    kvStore.set(key, { value: newValue, expiry: entry?.expiry });
    return newValue;
  }),

  // JSON operations
  json: {
    get: vi.fn().mockImplementation(async (key: string): Promise<any> => {
      const entry = kvStore.get(key);
      if (!entry || (entry.expiry && Date.now() > entry.expiry)) return null;
      return entry.value;
    }),
    set: vi.fn().mockImplementation(async (key: string, path: string, value: any): Promise<'OK'> => {
      if (path === '$' || path === '.') {
        kvStore.set(key, { value });
      } else {
        const entry = kvStore.get(key) || { value: {} };
        const obj = entry.value;
        const pathParts = path.replace(/^\$\.?/, '').split('.');
        let current = obj;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) current[pathParts[i]] = {};
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = value;
        kvStore.set(key, { value: obj, expiry: entry.expiry });
      }
      return 'OK';
    }),
  },

  // Hash operations
  hget: vi.fn().mockImplementation(async (key: string, field: string): Promise<string | null> => {
    const entry = kvStore.get(key);
    if (!entry || (entry.expiry && Date.now() > entry.expiry)) return null;
    return entry.value?.[field] ?? null;
  }),

  hset: vi.fn().mockImplementation(async (key: string, field: string, value: any): Promise<number> => {
    const entry = kvStore.get(key) || { value: {} };
    const isNew = !(field in (entry.value || {}));
    entry.value = { ...entry.value, [field]: value };
    kvStore.set(key, entry);
    return isNew ? 1 : 0;
  }),

  hgetall: vi.fn().mockImplementation(async (key: string): Promise<Record<string, string> | null> => {
    const entry = kvStore.get(key);
    if (!entry || (entry.expiry && Date.now() > entry.expiry)) return null;
    return entry.value || {};
  }),
};

// Helper functions

// Get raw store access (for testing)
export function getKvStore(): Map<string, CacheEntry> {
  return kvStore;
}

// Seed cache with data
export function seedKvData(key: string, value: any, ttlSeconds?: number) {
  kvStore.set(key, {
    value,
    expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
  });
}

// Clear all cache data
export function clearKvData() {
  kvStore.clear();
}

// Reset all mocks
export function resetKvMocks() {
  kvStore.clear();
  Object.values(kv).forEach(fn => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
}

// Export default for vi.mock
export default { kv };
