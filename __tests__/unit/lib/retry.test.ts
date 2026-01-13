/**
 * Tests for lib/utils/retry.ts
 *
 * Tests the retry with exponential backoff utility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retryWithBackoff } from "@/lib/utils/retry";

describe("retryWithBackoff", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful execution", () => {
    it("returns result on first try success", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      const result = await retryWithBackoff(fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("returns result after retry succeeds", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("First fail"))
        .mockResolvedValue("success");

      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 1, // Use minimal delay for fast tests
        maxDelay: 10,
      });

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("failure handling", () => {
    it("throws after max retries exceeded", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Always fails"));

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 2,
          initialDelay: 1,
          maxDelay: 10,
        })
      ).rejects.toThrow("Always fails");

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("throws last error after all retries fail", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockRejectedValue(new Error("Error 3"));

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 2,
          initialDelay: 1,
          maxDelay: 10,
        })
      ).rejects.toThrow("Error 3");
    });
  });

  describe("shouldRetry option", () => {
    it("stops retrying when shouldRetry returns false", async () => {
      const specificError = new Error("Non-retryable");
      const fn = vi.fn().mockRejectedValue(specificError);

      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(
        retryWithBackoff(fn, { shouldRetry })
      ).rejects.toThrow("Non-retryable");

      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(specificError);
    });

    it("continues retrying when shouldRetry returns true", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Retryable"))
        .mockResolvedValue("success");

      const shouldRetry = vi.fn().mockReturnValue(true);

      const result = await retryWithBackoff(fn, {
        shouldRetry,
        maxRetries: 3,
        initialDelay: 1,
        maxDelay: 10,
      });

      expect(result).toBe("success");
      expect(shouldRetry).toHaveBeenCalled();
    });

    it("does not call shouldRetry on last attempt", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Always fails"));
      const shouldRetry = vi.fn().mockReturnValue(true);

      await expect(
        retryWithBackoff(fn, {
          shouldRetry,
          maxRetries: 2,
          initialDelay: 1,
          maxDelay: 10,
        })
      ).rejects.toThrow("Always fails");

      // shouldRetry is called for attempts 0 and 1, but not for attempt 2 (final)
      expect(shouldRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe("delay configuration", () => {
    it("uses custom initialDelay", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Fail"))
        .mockResolvedValue("success");

      const startTime = Date.now();
      const result = await retryWithBackoff(fn, {
        initialDelay: 50,
        maxDelay: 100,
        maxRetries: 1,
      });
      const elapsed = Date.now() - startTime;

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
      // Should have waited at least 50ms (with some jitter)
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });

  describe("async function handling", () => {
    it("works with async functions that return different types", async () => {
      const fnNumber = vi.fn().mockResolvedValue(42);
      const fnObject = vi.fn().mockResolvedValue({ key: "value" });
      const fnArray = vi.fn().mockResolvedValue([1, 2, 3]);

      expect(await retryWithBackoff(fnNumber)).toBe(42);
      expect(await retryWithBackoff(fnObject)).toEqual({ key: "value" });
      expect(await retryWithBackoff(fnArray)).toEqual([1, 2, 3]);
    });

    it("preserves error type through retries", async () => {
      class CustomError extends Error {
        code: string;
        constructor(message: string, code: string) {
          super(message);
          this.code = code;
        }
      }

      const fn = vi
        .fn()
        .mockRejectedValue(new CustomError("Custom fail", "CUSTOM_CODE"));

      try {
        await retryWithBackoff(fn, { maxRetries: 0 });
      } catch (error) {
        expect(error instanceof CustomError).toBe(true);
        if (error instanceof CustomError) {
          expect(error.code).toBe("CUSTOM_CODE");
        }
      }
    });
  });

  describe("edge cases", () => {
    it("handles maxRetries of 0", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Fails immediately"));

      await expect(
        retryWithBackoff(fn, { maxRetries: 0 })
      ).rejects.toThrow("Fails immediately");

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("handles function that returns undefined", async () => {
      const fn = vi.fn().mockResolvedValue(undefined);

      const result = await retryWithBackoff(fn);

      expect(result).toBeUndefined();
    });

    it("handles function that returns null", async () => {
      const fn = vi.fn().mockResolvedValue(null);

      const result = await retryWithBackoff(fn);

      expect(result).toBeNull();
    });

    it("handles function that returns false", async () => {
      const fn = vi.fn().mockResolvedValue(false);

      const result = await retryWithBackoff(fn);

      expect(result).toBe(false);
    });

    it("handles function that returns 0", async () => {
      const fn = vi.fn().mockResolvedValue(0);

      const result = await retryWithBackoff(fn);

      expect(result).toBe(0);
    });

    it("handles function that returns empty string", async () => {
      const fn = vi.fn().mockResolvedValue("");

      const result = await retryWithBackoff(fn);

      expect(result).toBe("");
    });
  });
});
