/**
 * Tests for lib/cache/kv-client.ts
 *
 * Tests the KV client implementation including the InMemoryKV class.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to test the InMemoryKV class directly since it's not exported
// But we can test through the exported functions when KV is not configured

describe("kv-client", () => {
  beforeEach(() => {
    vi.resetModules();
    // Ensure KV is not configured so we use InMemoryKV
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("InMemoryKV (when Vercel KV not configured)", () => {
    it("isUsingInMemoryCache returns true when KV not configured", async () => {
      const { isUsingInMemoryCache } = await import("@/lib/cache/kv-client");
      expect(isUsingInMemoryCache()).toBe(true);
    });

    it("isHealthy returns true for in-memory cache", async () => {
      const { isHealthy } = await import("@/lib/cache/kv-client");
      const healthy = await isHealthy();
      expect(healthy).toBe(true);
    });

    describe("get/set operations", () => {
      it("returns null for non-existent key", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const result = await kv.get("non-existent-key");
        expect(result).toBeNull();
      });

      it("stores and retrieves string values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("test-key", "test-value");
        const result = await kv.get<string>("test-key");
        expect(result).toBe("test-value");
      });

      it("stores and retrieves object values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const testObject = { name: "Test", value: 42, nested: { a: 1 } };
        await kv.set("object-key", testObject);
        const result = await kv.get<typeof testObject>("object-key");
        expect(result).toEqual(testObject);
      });

      it("stores and retrieves array values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const testArray = [1, 2, 3, "test"];
        await kv.set("array-key", testArray);
        const result = await kv.get<typeof testArray>("array-key");
        expect(result).toEqual(testArray);
      });

      it("overwrites existing values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("overwrite-key", "first");
        await kv.set("overwrite-key", "second");
        const result = await kv.get<string>("overwrite-key");
        expect(result).toBe("second");
      });
    });

    describe("TTL expiration", () => {
      it("stores values with TTL", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("ttl-key", "ttl-value", { ex: 3600 });
        const result = await kv.get<string>("ttl-key");
        expect(result).toBe("ttl-value");
      });

      it("returns null for expired values", async () => {
        vi.useFakeTimers();
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("expired-key", "expired-value", { ex: 1 });

        // Value should exist initially
        let result = await kv.get<string>("expired-key");
        expect(result).toBe("expired-value");

        // Advance time past TTL
        vi.advanceTimersByTime(2000);

        // Value should be expired
        result = await kv.get<string>("expired-key");
        expect(result).toBeNull();

        vi.useRealTimers();
      });

      it("value persists without TTL", async () => {
        vi.useFakeTimers();
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("no-ttl-key", "persistent-value");

        // Advance time significantly
        vi.advanceTimersByTime(1000 * 60 * 60 * 24); // 24 hours

        // Value should still exist
        const result = await kv.get<string>("no-ttl-key");
        expect(result).toBe("persistent-value");

        vi.useRealTimers();
      });
    });

    describe("delete operation", () => {
      it("deletes existing keys", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("delete-key", "delete-value");

        // Verify it exists
        let result = await kv.get<string>("delete-key");
        expect(result).toBe("delete-value");

        // Delete it
        await kv.del("delete-key");

        // Verify it's gone
        result = await kv.get<string>("delete-key");
        expect(result).toBeNull();
      });

      it("silently handles deletion of non-existent keys", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        // Should not throw
        await expect(kv.del("non-existent")).resolves.toBeUndefined();
      });
    });

    describe("keys pattern matching", () => {
      it("returns matching keys with wildcard", async () => {
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("prefix:key1", "value1");
        await kv.set("prefix:key2", "value2");
        await kv.set("other:key3", "value3");

        const keys = await kv.keys("prefix:*");
        expect(keys).toHaveLength(2);
        expect(keys).toContain("prefix:key1");
        expect(keys).toContain("prefix:key2");
        expect(keys).not.toContain("other:key3");
      });

      it("returns empty array when no keys match", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const keys = await kv.keys("nonexistent:*");
        expect(keys).toEqual([]);
      });

      it("handles exact key match pattern", async () => {
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("exact-key", "value");
        await kv.set("exact-key-2", "value2");

        const keys = await kv.keys("exact-key");
        expect(keys).toEqual(["exact-key"]);
      });

      it("handles question mark wildcard", async () => {
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("key1", "value1");
        await kv.set("key2", "value2");
        await kv.set("key10", "value10");

        const keys = await kv.keys("key?");
        expect(keys).toHaveLength(2);
        expect(keys).toContain("key1");
        expect(keys).toContain("key2");
        expect(keys).not.toContain("key10");
      });
    });
  });

  describe("kvClient alias", () => {
    it("kvClient is an alias for kv", async () => {
      const { kv, kvClient } = await import("@/lib/cache/kv-client");
      expect(kvClient).toBe(kv);
    });
  });
});
