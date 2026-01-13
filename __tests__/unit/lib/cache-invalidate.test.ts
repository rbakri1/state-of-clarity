/**
 * Tests for lib/cache/invalidate.ts
 *
 * Tests cache invalidation functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { invalidateCache, invalidatePattern } from "@/lib/cache/invalidate";

// Mock the kv-client
vi.mock("@/lib/cache/kv-client", () => ({
  kv: {
    del: vi.fn(),
    keys: vi.fn(),
  },
}));

describe("cache/invalidate", () => {
  let mockKv: { del: ReturnType<typeof vi.fn>; keys: ReturnType<typeof vi.fn> };

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

  describe("invalidateCache", () => {
    it("deletes the specified key", async () => {
      mockKv.del.mockResolvedValue(undefined);

      await invalidateCache("test-key");

      expect(mockKv.del).toHaveBeenCalledWith("test-key");
      expect(mockKv.del).toHaveBeenCalledTimes(1);
    });

    it("logs successful invalidation", async () => {
      mockKv.del.mockResolvedValue(undefined);

      await invalidateCache("my-cache-key");

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("INVALIDATED")
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("my-cache-key")
      );
    });

    it("handles deletion errors gracefully", async () => {
      mockKv.del.mockRejectedValue(new Error("Redis connection failed"));

      // Should not throw
      await expect(invalidateCache("error-key")).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("error-key"),
        expect.any(Error)
      );
    });

    it("works with various key formats", async () => {
      mockKv.del.mockResolvedValue(undefined);

      await invalidateCache("brief:123");
      await invalidateCache("user:456:briefs");
      await invalidateCache("popular-briefs");

      expect(mockKv.del).toHaveBeenCalledTimes(3);
      expect(mockKv.del).toHaveBeenCalledWith("brief:123");
      expect(mockKv.del).toHaveBeenCalledWith("user:456:briefs");
      expect(mockKv.del).toHaveBeenCalledWith("popular-briefs");
    });
  });

  describe("invalidatePattern", () => {
    it("finds and deletes all matching keys", async () => {
      mockKv.keys.mockResolvedValue(["brief:1", "brief:2", "brief:3"]);
      mockKv.del.mockResolvedValue(undefined);

      await invalidatePattern("brief:*");

      expect(mockKv.keys).toHaveBeenCalledWith("brief:*");
      expect(mockKv.del).toHaveBeenCalledTimes(3);
      expect(mockKv.del).toHaveBeenCalledWith("brief:1");
      expect(mockKv.del).toHaveBeenCalledWith("brief:2");
      expect(mockKv.del).toHaveBeenCalledWith("brief:3");
    });

    it("logs the number of invalidated keys", async () => {
      mockKv.keys.mockResolvedValue(["key1", "key2"]);
      mockKv.del.mockResolvedValue(undefined);

      await invalidatePattern("prefix:*");

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("INVALIDATED 2 keys")
      );
    });

    it("handles no matching keys gracefully", async () => {
      mockKv.keys.mockResolvedValue([]);

      await invalidatePattern("nonexistent:*");

      expect(mockKv.del).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("No keys matched")
      );
    });

    it("handles keys lookup errors gracefully", async () => {
      mockKv.keys.mockRejectedValue(new Error("Connection timeout"));

      await expect(invalidatePattern("error:*")).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error invalidating pattern"),
        expect.any(Error)
      );
    });

    it("handles deletion errors for individual keys", async () => {
      mockKv.keys.mockResolvedValue(["key1", "key2"]);
      mockKv.del
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Delete failed"));

      // Should continue processing despite individual errors
      // Note: The current implementation doesn't handle individual delete errors,
      // but this test documents the expected behavior
      await invalidatePattern("test:*");

      expect(mockKv.del).toHaveBeenCalledTimes(2);
    });

    it("works with various pattern formats", async () => {
      mockKv.keys.mockResolvedValue([]);

      await invalidatePattern("user:*");
      await invalidatePattern("brief:*:sources");
      await invalidatePattern("*");

      expect(mockKv.keys).toHaveBeenCalledWith("user:*");
      expect(mockKv.keys).toHaveBeenCalledWith("brief:*:sources");
      expect(mockKv.keys).toHaveBeenCalledWith("*");
    });
  });
});
