/**
 * Tests for lib/cache/with-cache.ts
 *
 * Tests the cache wrapper utility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withCache } from "@/lib/cache/with-cache";

// Mock the kv-client
vi.mock("@/lib/cache/kv-client", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe("cache/with-cache", () => {
  let mockKv: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const kvModule = await import("@/lib/cache/kv-client");
    mockKv = kvModule.kv as typeof mockKv;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("cache hit", () => {
    it("returns cached value when present", async () => {
      mockKv.get.mockResolvedValue({ data: "cached" });
      const fn = vi.fn().mockResolvedValue({ data: "fresh" });

      const result = await withCache("test-key", fn, 3600);

      expect(result).toEqual({ data: "cached" });
      expect(fn).not.toHaveBeenCalled();
      expect(mockKv.set).not.toHaveBeenCalled();
    });

    it("logs cache hit", async () => {
      mockKv.get.mockResolvedValue("cached-value");
      const fn = vi.fn();

      await withCache("my-key", fn, 3600);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("HIT"));
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("my-key")
      );
    });

    it("returns various cached types", async () => {
      const fn = vi.fn();

      // String
      mockKv.get.mockResolvedValue("string value");
      expect(await withCache("key1", fn, 60)).toBe("string value");

      // Number
      mockKv.get.mockResolvedValue(42);
      expect(await withCache("key2", fn, 60)).toBe(42);

      // Array
      mockKv.get.mockResolvedValue([1, 2, 3]);
      expect(await withCache("key3", fn, 60)).toEqual([1, 2, 3]);

      // Object
      mockKv.get.mockResolvedValue({ nested: { value: true } });
      expect(await withCache("key4", fn, 60)).toEqual({ nested: { value: true } });

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("cache miss", () => {
    it("calls function and caches result when cache is empty", async () => {
      mockKv.get.mockResolvedValue(null);
      mockKv.set.mockResolvedValue(undefined);
      const fn = vi.fn().mockResolvedValue({ data: "fresh" });

      const result = await withCache("test-key", fn, 3600);

      expect(result).toEqual({ data: "fresh" });
      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockKv.set).toHaveBeenCalledWith(
        "test-key",
        { data: "fresh" },
        { ex: 3600 }
      );
    });

    it("logs cache miss and set", async () => {
      mockKv.get.mockResolvedValue(null);
      mockKv.set.mockResolvedValue(undefined);
      const fn = vi.fn().mockResolvedValue("value");

      await withCache("miss-key", fn, 300);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("MISS"));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("SET"));
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("TTL: 300s")
      );
    });

    it("uses correct TTL value", async () => {
      mockKv.get.mockResolvedValue(null);
      mockKv.set.mockResolvedValue(undefined);
      const fn = vi.fn().mockResolvedValue("data");

      await withCache("ttl-key", fn, 7200);

      expect(mockKv.set).toHaveBeenCalledWith("ttl-key", "data", { ex: 7200 });
    });
  });

  describe("cache read errors", () => {
    it("falls back to function when cache read fails", async () => {
      mockKv.get.mockRejectedValue(new Error("Cache read error"));
      mockKv.set.mockResolvedValue(undefined);
      const fn = vi.fn().mockResolvedValue("fallback-value");

      const result = await withCache("error-key", fn, 3600);

      expect(result).toBe("fallback-value");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalled();
    });

    it("still attempts to cache result after read error", async () => {
      mockKv.get.mockRejectedValue(new Error("Read failed"));
      mockKv.set.mockResolvedValue(undefined);
      const fn = vi.fn().mockResolvedValue("fresh-data");

      await withCache("key", fn, 60);

      expect(mockKv.set).toHaveBeenCalledWith("key", "fresh-data", { ex: 60 });
    });

    it("detects connection errors specifically", async () => {
      const connectionErrors = [
        "fetch failed",
        "ECONNREFUSED",
        "ETIMEDOUT",
        "socket hang up",
        "network error",
        "connection refused",
        "service unavailable",
        "upstash error",
      ];

      for (const errorMessage of connectionErrors) {
        mockKv.get.mockRejectedValue(new Error(errorMessage));
        mockKv.set.mockResolvedValue(undefined);
        const fn = vi.fn().mockResolvedValue("data");

        await withCache(`key-${errorMessage}`, fn, 60);

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining("Connection error detected")
        );
      }
    });
  });

  describe("cache write errors", () => {
    it("returns result even when cache write fails", async () => {
      mockKv.get.mockResolvedValue(null);
      mockKv.set.mockRejectedValue(new Error("Cache write error"));
      const fn = vi.fn().mockResolvedValue("important-data");

      const result = await withCache("write-error-key", fn, 3600);

      expect(result).toBe("important-data");
      expect(console.error).toHaveBeenCalled();
    });

    it("logs write error details", async () => {
      mockKv.get.mockResolvedValue(null);
      mockKv.set.mockRejectedValue(new Error("Write failed"));
      const fn = vi.fn().mockResolvedValue("data");

      await withCache("my-key", fn, 60);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("my-key"),
        expect.any(Error)
      );
    });
  });

  describe("function execution", () => {
    it("executes async functions correctly", async () => {
      mockKv.get.mockResolvedValue(null);
      mockKv.set.mockResolvedValue(undefined);

      const asyncFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "async-result";
      });

      const result = await withCache("async-key", asyncFn, 60);

      expect(result).toBe("async-result");
    });

    it("propagates function errors", async () => {
      mockKv.get.mockResolvedValue(null);
      const fn = vi.fn().mockRejectedValue(new Error("Function failed"));

      await expect(withCache("error-fn-key", fn, 60)).rejects.toThrow(
        "Function failed"
      );
    });

    it("handles functions returning null", async () => {
      mockKv.get.mockResolvedValue(null);
      mockKv.set.mockResolvedValue(undefined);
      const fn = vi.fn().mockResolvedValue(null);

      const result = await withCache("null-key", fn, 60);

      expect(result).toBeNull();
      expect(mockKv.set).toHaveBeenCalledWith("null-key", null, { ex: 60 });
    });

    it("handles functions returning undefined", async () => {
      mockKv.get.mockResolvedValue(null);
      mockKv.set.mockResolvedValue(undefined);
      const fn = vi.fn().mockResolvedValue(undefined);

      const result = await withCache("undefined-key", fn, 60);

      expect(result).toBeUndefined();
    });
  });
});
