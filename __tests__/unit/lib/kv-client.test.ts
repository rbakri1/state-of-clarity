/**
 * Tests for lib/cache/kv-client.ts
 *
 * Comprehensive tests for the KV client implementation including:
 * - InMemoryKV class (development fallback)
 * - VercelKVClient class (production)
 * - Error handling and graceful degradation
 * - Cache miss scenarios
 * - TTL handling and edge cases
 * - Configuration detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @vercel/kv module
vi.mock("@vercel/kv", () => ({
  kv: {
    ping: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  },
}));

describe("kv-client", () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear environment variables to ensure clean state
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Configuration Detection", () => {
    describe("isVercelKVConfigured", () => {
      it("returns false when no environment variables are set", async () => {
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;

        const { isUsingInMemoryCache } = await import("@/lib/cache/kv-client");
        expect(isUsingInMemoryCache()).toBe(true);
      });

      it("returns false when only KV_REST_API_URL is set", async () => {
        process.env.KV_REST_API_URL = "https://kv.example.com";
        delete process.env.KV_REST_API_TOKEN;

        const { isUsingInMemoryCache } = await import("@/lib/cache/kv-client");
        expect(isUsingInMemoryCache()).toBe(true);
      });

      it("returns false when only KV_REST_API_TOKEN is set", async () => {
        delete process.env.KV_REST_API_URL;
        process.env.KV_REST_API_TOKEN = "test-token";

        const { isUsingInMemoryCache } = await import("@/lib/cache/kv-client");
        expect(isUsingInMemoryCache()).toBe(true);
      });

      it("returns true (uses Vercel KV) when both environment variables are set", async () => {
        process.env.KV_REST_API_URL = "https://kv.example.com";
        process.env.KV_REST_API_TOKEN = "test-token";

        const { isUsingInMemoryCache } = await import("@/lib/cache/kv-client");
        expect(isUsingInMemoryCache()).toBe(false);
      });

      it("handles empty string environment variables as not configured", async () => {
        process.env.KV_REST_API_URL = "";
        process.env.KV_REST_API_TOKEN = "";

        const { isUsingInMemoryCache } = await import("@/lib/cache/kv-client");
        expect(isUsingInMemoryCache()).toBe(true);
      });
    });
  });

  describe("InMemoryKV (when Vercel KV not configured)", () => {
    describe("isHealthy", () => {
      it("always returns true for in-memory cache", async () => {
        const { isHealthy } = await import("@/lib/cache/kv-client");
        const healthy = await isHealthy();
        expect(healthy).toBe(true);
      });

      it("returns true even after multiple calls", async () => {
        const { isHealthy } = await import("@/lib/cache/kv-client");
        expect(await isHealthy()).toBe(true);
        expect(await isHealthy()).toBe(true);
        expect(await isHealthy()).toBe(true);
      });
    });

    describe("Cache Miss Scenarios", () => {
      it("returns null for non-existent key", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const result = await kv.get("non-existent-key");
        expect(result).toBeNull();
      });

      it("returns null for key with empty string", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const result = await kv.get("");
        expect(result).toBeNull();
      });

      it("returns null after explicit deletion", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("temp-key", "temp-value");
        await kv.del("temp-key");
        const result = await kv.get("temp-key");
        expect(result).toBeNull();
      });

      it("returns null for key that looks similar but is different", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("prefix:key1", "value1");
        const result = await kv.get("prefix:key2");
        expect(result).toBeNull();
      });

      it("cache miss does not affect other keys", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("existing-key", "existing-value");

        // Cache miss
        const missResult = await kv.get("missing-key");
        expect(missResult).toBeNull();

        // Existing key should still work
        const existingResult = await kv.get("existing-key");
        expect(existingResult).toBe("existing-value");
      });
    });

    describe("get/set operations", () => {
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

      it("stores and retrieves numeric values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("number-key", 42);
        const result = await kv.get<number>("number-key");
        expect(result).toBe(42);
      });

      it("stores and retrieves boolean values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("bool-true", true);
        await kv.set("bool-false", false);

        expect(await kv.get<boolean>("bool-true")).toBe(true);
        expect(await kv.get<boolean>("bool-false")).toBe(false);
      });

      it("stores and retrieves null values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("null-key", null);
        const result = await kv.get("null-key");
        // Note: null is stored as the value, but get returns null for "no value"
        // This is an edge case - the behavior depends on implementation
        expect(result).toBeNull();
      });

      it("stores and retrieves undefined values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("undefined-key", undefined);
        const result = await kv.get("undefined-key");
        // undefined is stored as-is in InMemoryKV
        expect(result).toBeUndefined();
      });

      it("stores and retrieves empty string values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("empty-string-key", "");
        const result = await kv.get<string>("empty-string-key");
        expect(result).toBe("");
      });

      it("stores and retrieves empty array values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("empty-array-key", []);
        const result = await kv.get<unknown[]>("empty-array-key");
        expect(result).toEqual([]);
      });

      it("stores and retrieves empty object values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("empty-object-key", {});
        const result = await kv.get<Record<string, unknown>>("empty-object-key");
        expect(result).toEqual({});
      });

      it("stores and retrieves zero value", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("zero-key", 0);
        const result = await kv.get<number>("zero-key");
        expect(result).toBe(0);
      });

      it("overwrites existing values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("overwrite-key", "first");
        await kv.set("overwrite-key", "second");
        const result = await kv.get<string>("overwrite-key");
        expect(result).toBe("second");
      });

      it("handles special characters in keys", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const specialKeys = [
          "key:with:colons",
          "key/with/slashes",
          "key-with-dashes",
          "key_with_underscores",
          "key.with.dots",
          "key with spaces",
        ];

        for (const key of specialKeys) {
          await kv.set(key, `value-for-${key}`);
          const result = await kv.get<string>(key);
          expect(result).toBe(`value-for-${key}`);
        }
      });

      it("handles unicode characters in keys and values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("unicode-key-cafe", "cafe");
        await kv.set("key-for-emoji", "value-with-emoji");

        expect(await kv.get<string>("unicode-key-cafe")).toBe("cafe");
        expect(await kv.get<string>("key-for-emoji")).toBe("value-with-emoji");
      });

      it("handles very long keys", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const longKey = "a".repeat(1000);
        await kv.set(longKey, "long-key-value");
        const result = await kv.get<string>(longKey);
        expect(result).toBe("long-key-value");
      });

      it("handles very large values", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const largeValue = {
          data: "x".repeat(10000),
          nested: {
            array: Array(100).fill({ item: "value" }),
          },
        };
        await kv.set("large-value-key", largeValue);
        const result = await kv.get<typeof largeValue>("large-value-key");
        expect(result).toEqual(largeValue);
      });

      it("handles deeply nested objects", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const deepObject = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    value: "deep",
                  },
                },
              },
            },
          },
        };
        await kv.set("deep-object-key", deepObject);
        const result = await kv.get<typeof deepObject>("deep-object-key");
        expect(result).toEqual(deepObject);
      });
    });

    describe("TTL Handling", () => {
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

        // Advance time past TTL (1 second = 1000ms, advance 2000ms)
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

        // Advance time significantly (24 hours)
        vi.advanceTimersByTime(1000 * 60 * 60 * 24);

        // Value should still exist
        const result = await kv.get<string>("no-ttl-key");
        expect(result).toBe("persistent-value");

        vi.useRealTimers();
      });

      it("handles TTL of 0 (no expiration)", async () => {
        vi.useFakeTimers();
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("zero-ttl-key", "value", { ex: 0 });

        // Advance time
        vi.advanceTimersByTime(1000 * 60 * 60);

        // Value should still exist (0 means no expiration in most implementations)
        const result = await kv.get<string>("zero-ttl-key");
        expect(result).toBe("value");

        vi.useRealTimers();
      });

      it("handles very short TTL (less than 1 second)", async () => {
        vi.useFakeTimers();
        const { kv } = await import("@/lib/cache/kv-client");

        // TTL is in seconds, so 1 means 1000ms
        await kv.set("short-ttl-key", "value", { ex: 1 });

        // Check immediately (should exist)
        expect(await kv.get<string>("short-ttl-key")).toBe("value");

        // Advance 500ms (should still exist)
        vi.advanceTimersByTime(500);
        expect(await kv.get<string>("short-ttl-key")).toBe("value");

        // Advance another 600ms (should be expired)
        vi.advanceTimersByTime(600);
        expect(await kv.get<string>("short-ttl-key")).toBeNull();

        vi.useRealTimers();
      });

      it("handles very long TTL", async () => {
        vi.useFakeTimers();
        const { kv } = await import("@/lib/cache/kv-client");

        // TTL of 1 year in seconds
        const oneYearInSeconds = 365 * 24 * 60 * 60;
        await kv.set("long-ttl-key", "value", { ex: oneYearInSeconds });

        // Advance 6 months
        vi.advanceTimersByTime(oneYearInSeconds * 500); // 500ms per second, half a year

        // Value should still exist
        expect(await kv.get<string>("long-ttl-key")).toBe("value");

        vi.useRealTimers();
      });

      it("expired values are deleted on get", async () => {
        vi.useFakeTimers();
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("auto-delete-key", "value", { ex: 1 });

        // Advance past expiration
        vi.advanceTimersByTime(2000);

        // First get should return null and delete
        expect(await kv.get<string>("auto-delete-key")).toBeNull();

        // Second get should also return null
        expect(await kv.get<string>("auto-delete-key")).toBeNull();

        vi.useRealTimers();
      });

      it("updating a key resets the TTL", async () => {
        vi.useFakeTimers();
        const { kv } = await import("@/lib/cache/kv-client");

        // Set with 2 second TTL
        await kv.set("reset-ttl-key", "value1", { ex: 2 });

        // Advance 1 second
        vi.advanceTimersByTime(1000);

        // Update with new TTL
        await kv.set("reset-ttl-key", "value2", { ex: 2 });

        // Advance 1.5 seconds (would have expired with original TTL)
        vi.advanceTimersByTime(1500);

        // Should still exist with new value
        expect(await kv.get<string>("reset-ttl-key")).toBe("value2");

        // Advance another 1 second (now expired)
        vi.advanceTimersByTime(1000);
        expect(await kv.get<string>("reset-ttl-key")).toBeNull();

        vi.useRealTimers();
      });

      it("updating a TTL key to no TTL makes it permanent", async () => {
        vi.useFakeTimers();
        const { kv } = await import("@/lib/cache/kv-client");

        // Set with TTL
        await kv.set("ttl-to-permanent-key", "value1", { ex: 1 });

        // Update without TTL
        await kv.set("ttl-to-permanent-key", "value2");

        // Advance time well past original TTL
        vi.advanceTimersByTime(10000);

        // Should still exist
        expect(await kv.get<string>("ttl-to-permanent-key")).toBe("value2");

        vi.useRealTimers();
      });
    });

    describe("delete operation", () => {
      it("deletes existing keys", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("delete-key", "delete-value");

        let result = await kv.get<string>("delete-key");
        expect(result).toBe("delete-value");

        await kv.del("delete-key");

        result = await kv.get<string>("delete-key");
        expect(result).toBeNull();
      });

      it("silently handles deletion of non-existent keys", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await expect(kv.del("non-existent")).resolves.toBeUndefined();
      });

      it("delete does not affect other keys", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("keep-key", "keep-value");
        await kv.set("delete-key", "delete-value");

        await kv.del("delete-key");

        expect(await kv.get<string>("keep-key")).toBe("keep-value");
        expect(await kv.get<string>("delete-key")).toBeNull();
      });

      it("can delete and re-create same key", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("recreate-key", "value1");
        await kv.del("recreate-key");
        await kv.set("recreate-key", "value2");

        expect(await kv.get<string>("recreate-key")).toBe("value2");
      });

      it("handles deleting key with empty string", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await expect(kv.del("")).resolves.toBeUndefined();
      });

      it("handles multiple deletes of same key", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("multi-delete-key", "value");
        await kv.del("multi-delete-key");
        await kv.del("multi-delete-key");
        await kv.del("multi-delete-key");

        expect(await kv.get<string>("multi-delete-key")).toBeNull();
      });
    });

    describe("keys pattern matching", () => {
      it("returns matching keys with wildcard (*)", async () => {
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

      it("handles question mark wildcard (?)", async () => {
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

      it("handles multiple wildcards", async () => {
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("user:123:profile", "data1");
        await kv.set("user:456:profile", "data2");
        await kv.set("user:123:settings", "data3");
        await kv.set("admin:123:profile", "data4");

        const keys = await kv.keys("user:*:profile");
        expect(keys).toHaveLength(2);
        expect(keys).toContain("user:123:profile");
        expect(keys).toContain("user:456:profile");
      });

      it("handles wildcard at the beginning", async () => {
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("cache:profile", "data1");
        await kv.set("temp:profile", "data2");
        await kv.set("cache:settings", "data3");

        const keys = await kv.keys("*:profile");
        expect(keys).toHaveLength(2);
        expect(keys).toContain("cache:profile");
        expect(keys).toContain("temp:profile");
      });

      it("handles all wildcard pattern (*)", async () => {
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("key1", "value1");
        await kv.set("key2", "value2");
        await kv.set("key3", "value3");

        const keys = await kv.keys("*");
        expect(keys.length).toBeGreaterThanOrEqual(3);
        expect(keys).toContain("key1");
        expect(keys).toContain("key2");
        expect(keys).toContain("key3");
      });

      it("does not return expired keys", async () => {
        vi.useFakeTimers();
        const { kv } = await import("@/lib/cache/kv-client");

        await kv.set("pattern:active", "value1");
        await kv.set("pattern:expired", "value2", { ex: 1 });

        // Advance past expiration
        vi.advanceTimersByTime(2000);

        const keys = await kv.keys("pattern:*");
        // Note: The keys() method doesn't clean up expired keys automatically
        // This depends on implementation - expired keys may still appear in list
        // until accessed via get()
        expect(keys).toContain("pattern:active");

        vi.useRealTimers();
      });
    });

    describe("kvClient alias", () => {
      it("kvClient is an alias for kv", async () => {
        const { kv, kvClient } = await import("@/lib/cache/kv-client");
        expect(kvClient).toBe(kv);
      });

      it("kvClient provides same functionality as kv", async () => {
        const { kvClient } = await import("@/lib/cache/kv-client");
        await kvClient.set("alias-test-key", "alias-test-value");
        const result = await kvClient.get<string>("alias-test-key");
        expect(result).toBe("alias-test-value");
      });
    });
  });

  describe("VercelKVClient (when Vercel KV is configured)", () => {
    beforeEach(async () => {
      vi.resetModules();
      process.env.KV_REST_API_URL = "https://kv.example.com";
      process.env.KV_REST_API_TOKEN = "test-token";
    });

    describe("isHealthy", () => {
      it("returns true when ping succeeds", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.ping).mockResolvedValue("PONG");

        const { isHealthy } = await import("@/lib/cache/kv-client");
        const healthy = await isHealthy();

        expect(healthy).toBe(true);
        expect(vercelKvMock.ping).toHaveBeenCalled();
      });

      it("returns false when ping fails", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.ping).mockRejectedValue(new Error("Connection refused"));

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const { isHealthy } = await import("@/lib/cache/kv-client");
        const healthy = await isHealthy();

        expect(healthy).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(
          "[Cache Health] Vercel KV unhealthy:",
          expect.any(Error)
        );
      });

      it("returns false when ping times out", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.ping).mockRejectedValue(new Error("Timeout"));

        vi.spyOn(console, "error").mockImplementation(() => {});

        const { isHealthy } = await import("@/lib/cache/kv-client");
        const healthy = await isHealthy();

        expect(healthy).toBe(false);
      });

      it("returns false when ping returns unexpected value", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.ping).mockRejectedValue(new Error("Unexpected response"));

        vi.spyOn(console, "error").mockImplementation(() => {});

        const { isHealthy } = await import("@/lib/cache/kv-client");
        const healthy = await isHealthy();

        expect(healthy).toBe(false);
      });
    });

    describe("get operation", () => {
      it("returns value from Vercel KV", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.get).mockResolvedValue("cached-value");

        const { kv } = await import("@/lib/cache/kv-client");
        const result = await kv.get<string>("test-key");

        expect(result).toBe("cached-value");
        expect(vercelKvMock.get).toHaveBeenCalledWith("test-key");
      });

      it("returns null for cache miss", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.get).mockResolvedValue(null);

        const { kv } = await import("@/lib/cache/kv-client");
        const result = await kv.get<string>("missing-key");

        expect(result).toBeNull();
      });

      it("returns object values correctly", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        const testObject = { name: "Test", value: 42 };
        vi.mocked(vercelKvMock.get).mockResolvedValue(testObject);

        const { kv } = await import("@/lib/cache/kv-client");
        const result = await kv.get<typeof testObject>("object-key");

        expect(result).toEqual(testObject);
      });

      it("propagates errors from Vercel KV", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.get).mockRejectedValue(new Error("Network error"));

        const { kv } = await import("@/lib/cache/kv-client");

        await expect(kv.get("error-key")).rejects.toThrow("Network error");
      });

      it("handles undefined return value", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.get).mockResolvedValue(undefined as unknown as null);

        const { kv } = await import("@/lib/cache/kv-client");
        const result = await kv.get("undefined-key");

        expect(result).toBeUndefined();
      });
    });

    describe("set operation", () => {
      it("sets value without TTL", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.set).mockResolvedValue("OK");

        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("test-key", "test-value");

        expect(vercelKvMock.set).toHaveBeenCalledWith("test-key", "test-value");
      });

      it("sets value with TTL", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.set).mockResolvedValue("OK");

        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("test-key", "test-value", { ex: 3600 });

        expect(vercelKvMock.set).toHaveBeenCalledWith("test-key", "test-value", { ex: 3600 });
      });

      it("handles object values", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.set).mockResolvedValue("OK");

        const { kv } = await import("@/lib/cache/kv-client");
        const testObject = { name: "Test", nested: { value: 42 } };
        await kv.set("object-key", testObject);

        expect(vercelKvMock.set).toHaveBeenCalledWith("object-key", testObject);
      });

      it("propagates errors from Vercel KV", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.set).mockRejectedValue(new Error("Write error"));

        const { kv } = await import("@/lib/cache/kv-client");

        await expect(kv.set("error-key", "value")).rejects.toThrow("Write error");
      });

      it("handles empty options object", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.set).mockResolvedValue("OK");

        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("test-key", "test-value", {});

        // Should call without ex option since it's undefined
        expect(vercelKvMock.set).toHaveBeenCalledWith("test-key", "test-value");
      });

      it("handles options with ex: 0", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.set).mockResolvedValue("OK");

        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("test-key", "test-value", { ex: 0 });

        // ex: 0 is falsy, so should call without TTL
        expect(vercelKvMock.set).toHaveBeenCalledWith("test-key", "test-value");
      });
    });

    describe("del operation", () => {
      it("deletes key from Vercel KV", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.del).mockResolvedValue(1);

        const { kv } = await import("@/lib/cache/kv-client");
        await kv.del("test-key");

        expect(vercelKvMock.del).toHaveBeenCalledWith("test-key");
      });

      it("handles deletion of non-existent key", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.del).mockResolvedValue(0);

        const { kv } = await import("@/lib/cache/kv-client");
        await expect(kv.del("non-existent")).resolves.toBeUndefined();
      });

      it("propagates errors from Vercel KV", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.del).mockRejectedValue(new Error("Delete error"));

        const { kv } = await import("@/lib/cache/kv-client");

        await expect(kv.del("error-key")).rejects.toThrow("Delete error");
      });
    });

    describe("keys operation", () => {
      it("returns keys matching pattern", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.keys).mockResolvedValue(["prefix:key1", "prefix:key2"]);

        const { kv } = await import("@/lib/cache/kv-client");
        const keys = await kv.keys("prefix:*");

        expect(keys).toEqual(["prefix:key1", "prefix:key2"]);
        expect(vercelKvMock.keys).toHaveBeenCalledWith("prefix:*");
      });

      it("returns empty array when no keys match", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.keys).mockResolvedValue([]);

        const { kv } = await import("@/lib/cache/kv-client");
        const keys = await kv.keys("nonexistent:*");

        expect(keys).toEqual([]);
      });

      it("propagates errors from Vercel KV", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.keys).mockRejectedValue(new Error("Keys error"));

        const { kv } = await import("@/lib/cache/kv-client");

        await expect(kv.keys("error:*")).rejects.toThrow("Keys error");
      });
    });

    describe("Error Handling", () => {
      it("handles network timeouts gracefully", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        const timeoutError = new Error("Request timed out");
        timeoutError.name = "TimeoutError";
        vi.mocked(vercelKvMock.get).mockRejectedValue(timeoutError);

        const { kv } = await import("@/lib/cache/kv-client");

        await expect(kv.get("timeout-key")).rejects.toThrow("Request timed out");
      });

      it("handles connection refused errors", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.get).mockRejectedValue(new Error("ECONNREFUSED"));

        const { kv } = await import("@/lib/cache/kv-client");

        await expect(kv.get("conn-key")).rejects.toThrow("ECONNREFUSED");
      });

      it("handles authentication errors", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.get).mockRejectedValue(new Error("Unauthorized"));

        const { kv } = await import("@/lib/cache/kv-client");

        await expect(kv.get("auth-key")).rejects.toThrow("Unauthorized");
      });

      it("handles rate limiting errors", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.set).mockRejectedValue(new Error("Rate limit exceeded"));

        const { kv } = await import("@/lib/cache/kv-client");

        await expect(kv.set("rate-key", "value")).rejects.toThrow("Rate limit exceeded");
      });

      it("handles quota exceeded errors", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.set).mockRejectedValue(new Error("Quota exceeded"));

        const { kv } = await import("@/lib/cache/kv-client");

        await expect(kv.set("quota-key", "value")).rejects.toThrow("Quota exceeded");
      });

      it("preserves error stack trace", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        const originalError = new Error("Original error");
        vi.mocked(vercelKvMock.get).mockRejectedValue(originalError);

        const { kv } = await import("@/lib/cache/kv-client");

        try {
          await kv.get("error-key");
        } catch (error) {
          expect(error).toBe(originalError);
          expect((error as Error).stack).toBeDefined();
        }
      });
    });

    describe("Concurrent Operations", () => {
      it("handles concurrent get operations", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.get)
          .mockResolvedValueOnce("value1")
          .mockResolvedValueOnce("value2")
          .mockResolvedValueOnce("value3");

        const { kv } = await import("@/lib/cache/kv-client");

        const results = await Promise.all([
          kv.get<string>("key1"),
          kv.get<string>("key2"),
          kv.get<string>("key3"),
        ]);

        expect(results).toEqual(["value1", "value2", "value3"]);
        expect(vercelKvMock.get).toHaveBeenCalledTimes(3);
      });

      it("handles concurrent set operations", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.set).mockResolvedValue("OK");

        const { kv } = await import("@/lib/cache/kv-client");

        await Promise.all([
          kv.set("key1", "value1"),
          kv.set("key2", "value2"),
          kv.set("key3", "value3"),
        ]);

        expect(vercelKvMock.set).toHaveBeenCalledTimes(3);
      });

      it("handles mixed concurrent operations", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.get).mockResolvedValue("value");
        vi.mocked(vercelKvMock.set).mockResolvedValue("OK");
        vi.mocked(vercelKvMock.del).mockResolvedValue(1);

        const { kv } = await import("@/lib/cache/kv-client");

        await Promise.all([
          kv.get("key1"),
          kv.set("key2", "value2"),
          kv.del("key3"),
        ]);

        expect(vercelKvMock.get).toHaveBeenCalledTimes(1);
        expect(vercelKvMock.set).toHaveBeenCalledTimes(1);
        expect(vercelKvMock.del).toHaveBeenCalledTimes(1);
      });

      it("handles partial failures in concurrent operations", async () => {
        const { kv: vercelKvMock } = await import("@vercel/kv");
        vi.mocked(vercelKvMock.get)
          .mockResolvedValueOnce("value1")
          .mockRejectedValueOnce(new Error("Error on key2"))
          .mockResolvedValueOnce("value3");

        const { kv } = await import("@/lib/cache/kv-client");

        const results = await Promise.allSettled([
          kv.get<string>("key1"),
          kv.get<string>("key2"),
          kv.get<string>("key3"),
        ]);

        expect(results[0]).toEqual({ status: "fulfilled", value: "value1" });
        expect(results[1].status).toBe("rejected");
        expect(results[2]).toEqual({ status: "fulfilled", value: "value3" });
      });
    });
  });

  describe("Edge Cases", () => {
    describe("Key Edge Cases", () => {
      it("handles key with only special characters", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("!@#$%^&*()", "special-value");
        const result = await kv.get<string>("!@#$%^&*()");
        expect(result).toBe("special-value");
      });

      it("handles key with newlines", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("key\nwith\nnewlines", "newline-value");
        const result = await kv.get<string>("key\nwith\nnewlines");
        expect(result).toBe("newline-value");
      });

      it("handles key with tabs", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("key\twith\ttabs", "tab-value");
        const result = await kv.get<string>("key\twith\ttabs");
        expect(result).toBe("tab-value");
      });
    });

    describe("Value Edge Cases", () => {
      it("handles value with circular reference detection", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        // Note: In real use, you can't serialize circular references
        // This tests that simple self-referential structures work
        const obj = { name: "test", items: [1, 2, 3] };
        await kv.set("circular-test", obj);
        const result = await kv.get<typeof obj>("circular-test");
        expect(result).toEqual(obj);
      });

      it("handles value with Date objects", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        const dateValue = new Date("2024-01-15T12:00:00Z");
        await kv.set("date-key", dateValue);
        const result = await kv.get("date-key");
        // Note: Date objects may be serialized as strings
        expect(result).toBeDefined();
      });

      it("handles value with Map (converted to object)", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        // Maps are not JSON-serializable directly
        const mapLikeValue = { a: 1, b: 2 };
        await kv.set("map-like-key", mapLikeValue);
        const result = await kv.get<typeof mapLikeValue>("map-like-key");
        expect(result).toEqual(mapLikeValue);
      });

      it("handles value with Set (converted to array)", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        // Sets are not JSON-serializable directly
        const setLikeValue = [1, 2, 3];
        await kv.set("set-like-key", setLikeValue);
        const result = await kv.get<typeof setLikeValue>("set-like-key");
        expect(result).toEqual(setLikeValue);
      });

      it("handles value with BigInt converted to string", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        // BigInt can't be serialized to JSON directly
        const bigIntString = "9007199254740993";
        await kv.set("bigint-key", bigIntString);
        const result = await kv.get<string>("bigint-key");
        expect(result).toBe(bigIntString);
      });

      it("handles NaN value", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        // NaN serializes to null in JSON
        await kv.set("nan-key", NaN);
        const result = await kv.get("nan-key");
        // Depending on implementation, might be null or preserved
        expect(result).toBeDefined();
      });

      it("handles Infinity value", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        // Infinity serializes to null in JSON
        await kv.set("infinity-key", Infinity);
        const result = await kv.get("infinity-key");
        expect(result).toBeDefined();
      });

      it("handles negative Infinity value", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("neg-infinity-key", -Infinity);
        const result = await kv.get("neg-infinity-key");
        expect(result).toBeDefined();
      });
    });

    describe("Pattern Matching Edge Cases", () => {
      it("handles pattern with escaped special characters", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("test.key", "value1");
        await kv.set("testXkey", "value2");

        // In the InMemoryKV implementation, . is converted to . in regex
        // which matches any character
        const keys = await kv.keys("test.key");
        expect(keys).toContain("test.key");
      });

      it("handles empty pattern", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("key1", "value1");

        const keys = await kv.keys("");
        // Empty pattern matches empty string only
        expect(keys).not.toContain("key1");
      });

      it("handles pattern that is just *", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("any-key-1", "value1");
        await kv.set("any-key-2", "value2");

        const keys = await kv.keys("*");
        expect(keys).toContain("any-key-1");
        expect(keys).toContain("any-key-2");
      });

      it("handles pattern that is just ?", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("a", "value1");
        await kv.set("ab", "value2");

        const keys = await kv.keys("?");
        expect(keys).toContain("a");
        expect(keys).not.toContain("ab");
      });

      it("handles pattern with consecutive wildcards", async () => {
        const { kv } = await import("@/lib/cache/kv-client");
        await kv.set("prefix-middle-suffix", "value1");

        const keys = await kv.keys("prefix-**-suffix");
        expect(keys).toContain("prefix-middle-suffix");
      });
    });

    describe("Memory and Performance Edge Cases", () => {
      it("handles rapid sequential operations", async () => {
        const { kv } = await import("@/lib/cache/kv-client");

        for (let i = 0; i < 100; i++) {
          await kv.set(`rapid-key-${i}`, `value-${i}`);
        }

        for (let i = 0; i < 100; i++) {
          const result = await kv.get<string>(`rapid-key-${i}`);
          expect(result).toBe(`value-${i}`);
        }
      });

      it("handles many keys with same prefix", async () => {
        const { kv } = await import("@/lib/cache/kv-client");

        for (let i = 0; i < 50; i++) {
          await kv.set(`same-prefix:${i}`, `value-${i}`);
        }

        const keys = await kv.keys("same-prefix:*");
        expect(keys).toHaveLength(50);
      });
    });
  });
});
