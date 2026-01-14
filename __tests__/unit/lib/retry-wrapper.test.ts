/**
 * Tests for lib/agents/retry-wrapper.ts
 *
 * Tests the agent retry wrapper with exponential backoff, error classification,
 * and smart retry logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  withRetry,
  AgentRetryError,
  wrapWithRetry,
  isRetryableError,
  withSmartRetry,
} from "@/lib/agents/retry-wrapper";

describe("retry-wrapper", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("withRetry", () => {
    describe("successful execution", () => {
      it("returns result on first attempt success", async () => {
        const fn = vi.fn().mockResolvedValue("success");

        const result = await withRetry(fn, {
          agentName: "TestAgent",
          initialDelayMs: 1,
        });

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it("does not log retry success message on first attempt", async () => {
        const fn = vi.fn().mockResolvedValue("success");

        await withRetry(fn, { agentName: "TestAgent", initialDelayMs: 1 });

        // Should only log the attempt message, not the "Succeeded after retries" message
        expect(console.log).toHaveBeenCalledWith("[TestAgent] Attempt 1/3");
        expect(console.log).not.toHaveBeenCalledWith(
          expect.stringContaining("Succeeded on attempt")
        );
      });
    });

    describe("retry on failure then success", () => {
      it("retries and succeeds on second attempt", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("First fail"))
          .mockResolvedValue("success");

        const result = await withRetry(fn, {
          agentName: "TestAgent",
          initialDelayMs: 1,
        });

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(2);
      });

      it("retries and succeeds on third attempt", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("First fail"))
          .mockRejectedValueOnce(new Error("Second fail"))
          .mockResolvedValue("success");

        const result = await withRetry(fn, {
          agentName: "TestAgent",
          initialDelayMs: 1,
        });

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(3);
      });

      it("logs success message after retry", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("First fail"))
          .mockResolvedValue("success");

        await withRetry(fn, { agentName: "TestAgent", initialDelayMs: 1 });

        expect(console.log).toHaveBeenCalledWith(
          "[TestAgent] Succeeded on attempt 2 after 1 retries"
        );
      });
    });

    describe("all retries exhausted", () => {
      it("throws AgentRetryError after max retries", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("Always fails"));

        await expect(
          withRetry(fn, {
            agentName: "TestAgent",
            maxRetries: 3,
            initialDelayMs: 1,
          })
        ).rejects.toThrow(AgentRetryError);

        expect(fn).toHaveBeenCalledTimes(3);
      });

      it("includes correct message in AgentRetryError", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("test"));

        await expect(
          withRetry(fn, {
            agentName: "Test",
            maxRetries: 1,
            initialDelayMs: 1,
          })
        ).rejects.toThrow("Test failed after 1 attempts");
      });

      it("collects all errors in AgentRetryError", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("Error 1"))
          .mockRejectedValueOnce(new Error("Error 2"))
          .mockRejectedValue(new Error("Error 3"));

        try {
          await withRetry(fn, {
            agentName: "TestAgent",
            maxRetries: 3,
            initialDelayMs: 1,
          });
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(AgentRetryError);
          const retryError = error as AgentRetryError;
          expect(retryError.errors).toHaveLength(3);
          expect(retryError.errors[0].message).toBe("Error 1");
          expect(retryError.errors[1].message).toBe("Error 2");
          expect(retryError.errors[2].message).toBe("Error 3");
        }
      });

      it("logs all attempts failed message", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("Always fails"));

        try {
          await withRetry(fn, {
            agentName: "TestAgent",
            maxRetries: 2,
            initialDelayMs: 1,
          });
        } catch {
          // Expected
        }

        expect(console.error).toHaveBeenCalledWith(
          "[TestAgent] All 2 attempts failed:",
          expect.objectContaining({
            agentName: "TestAgent",
            totalAttempts: 2,
          })
        );
      });
    });

    describe("exponential backoff delays", () => {
      it("uses correct exponential backoff delays", async () => {
        const delays: number[] = [];
        vi.spyOn(console, "log").mockImplementation((...args) => {
          const msg = args[0] as string;
          if (typeof msg === "string" && msg.includes("Retrying in")) {
            const match = msg.match(/Retrying in (\d+)ms/);
            if (match) {
              delays.push(parseInt(match[1], 10));
            }
          }
        });

        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("Fail 1"))
          .mockRejectedValueOnce(new Error("Fail 2"))
          .mockRejectedValueOnce(new Error("Fail 3"))
          .mockResolvedValue("success");

        await withRetry(fn, {
          agentName: "TestAgent",
          maxRetries: 4,
          initialDelayMs: 10,
          backoffMultiplier: 2,
        });

        // Delays should be: 10, 20, 40 (exponential backoff)
        expect(delays).toEqual([10, 20, 40]);
      });

      it("logs retry delay message", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("Fail"))
          .mockResolvedValue("success");

        await withRetry(fn, {
          agentName: "TestAgent",
          initialDelayMs: 5,
        });

        expect(console.log).toHaveBeenCalledWith(
          "[TestAgent] Retrying in 5ms..."
        );
      });

      it("uses custom backoff multiplier", async () => {
        const delays: number[] = [];
        vi.spyOn(console, "log").mockImplementation((...args) => {
          const msg = args[0] as string;
          if (typeof msg === "string" && msg.includes("Retrying in")) {
            const match = msg.match(/Retrying in (\d+)ms/);
            if (match) {
              delays.push(parseInt(match[1], 10));
            }
          }
        });

        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("Fail 1"))
          .mockRejectedValueOnce(new Error("Fail 2"))
          .mockResolvedValue("success");

        await withRetry(fn, {
          agentName: "TestAgent",
          maxRetries: 3,
          initialDelayMs: 5,
          backoffMultiplier: 3,
        });

        // Delays should be: 5 (5 * 3^0), 15 (5 * 3^1)
        expect(delays).toEqual([5, 15]);
      });
    });

    describe("configuration", () => {
      it("uses default config values when not specified", async () => {
        const fn = vi.fn().mockResolvedValue("success");

        await withRetry(fn, { agentName: "TestAgent" });

        // Default maxRetries is 3
        expect(console.log).toHaveBeenCalledWith("[TestAgent] Attempt 1/3");
      });

      it("handles non-Error exceptions", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce("string error")
          .mockResolvedValue("success");

        const result = await withRetry(fn, {
          agentName: "TestAgent",
          maxRetries: 2,
          initialDelayMs: 1,
        });

        expect(result).toBe("success");
      });
    });
  });

  describe("AgentRetryError", () => {
    it("has correct name property", () => {
      const errors = [new Error("test")];
      const error = new AgentRetryError("Test message", errors, "TestAgent");

      expect(error.name).toBe("AgentRetryError");
    });

    it("has correct message property", () => {
      const errors = [new Error("test")];
      const error = new AgentRetryError("Test message", errors, "TestAgent");

      expect(error.message).toBe("Test message");
    });

    it("stores errors array", () => {
      const errors = [
        new Error("Error 1"),
        new Error("Error 2"),
        new Error("Error 3"),
      ];
      const error = new AgentRetryError("Test message", errors, "TestAgent");

      expect(error.errors).toBe(errors);
      expect(error.errors).toHaveLength(3);
    });

    it("stores agentName", () => {
      const errors = [new Error("test")];
      const error = new AgentRetryError("Test message", errors, "MyAgent");

      expect(error.agentName).toBe("MyAgent");
    });

    it("calculates attempts from errors array length", () => {
      const errors = [new Error("1"), new Error("2"), new Error("3")];
      const error = new AgentRetryError("Test message", errors, "TestAgent");

      expect(error.attempts).toBe(3);
    });

    describe("getLastError", () => {
      it("returns the last error from errors array", () => {
        const lastError = new Error("Last error");
        const errors = [new Error("First"), new Error("Second"), lastError];
        const error = new AgentRetryError("Test message", errors, "TestAgent");

        expect(error.getLastError()).toBe(lastError);
      });

      it("returns undefined for empty errors array", () => {
        const error = new AgentRetryError("Test message", [], "TestAgent");

        expect(error.getLastError()).toBeUndefined();
      });

      it("returns single error when only one error exists", () => {
        const singleError = new Error("Only error");
        const error = new AgentRetryError(
          "Test message",
          [singleError],
          "TestAgent"
        );

        expect(error.getLastError()).toBe(singleError);
      });
    });

    it("is instanceof Error", () => {
      const error = new AgentRetryError(
        "Test",
        [new Error("test")],
        "TestAgent"
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AgentRetryError);
    });
  });

  describe("wrapWithRetry", () => {
    it("creates a wrapped function that retries on failure", async () => {
      const originalFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("First fail"))
        .mockResolvedValue("success");

      const wrappedFn = wrapWithRetry("WrappedAgent", originalFn, {
        initialDelayMs: 1,
      });

      const result = await wrappedFn();

      expect(result).toBe("success");
      expect(originalFn).toHaveBeenCalledTimes(2);
    });

    it("passes arguments to wrapped function", async () => {
      const originalFn = vi.fn().mockResolvedValue("result");

      const wrappedFn = wrapWithRetry("WrappedAgent", originalFn, {
        initialDelayMs: 1,
      });

      await wrappedFn("arg1", 42, { key: "value" });

      expect(originalFn).toHaveBeenCalledWith("arg1", 42, { key: "value" });
    });

    it("uses custom config when provided", async () => {
      const originalFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Fail"))
        .mockResolvedValue("success");

      const wrappedFn = wrapWithRetry("WrappedAgent", originalFn, {
        initialDelayMs: 1,
        maxRetries: 2,
      });

      await wrappedFn();

      expect(console.log).toHaveBeenCalledWith("[WrappedAgent] Attempt 1/2");
    });

    it("throws AgentRetryError when all retries fail", async () => {
      const originalFn = vi.fn().mockRejectedValue(new Error("Always fails"));

      const wrappedFn = wrapWithRetry("WrappedAgent", originalFn, {
        maxRetries: 2,
        initialDelayMs: 1,
      });

      await expect(wrappedFn()).rejects.toThrow(AgentRetryError);
    });

    it("preserves return type of wrapped function", async () => {
      interface ResultType {
        data: string;
        count: number;
      }

      const originalFn = vi
        .fn<[string], Promise<ResultType>>()
        .mockResolvedValue({ data: "test", count: 5 });

      const wrappedFn = wrapWithRetry("WrappedAgent", originalFn, {
        initialDelayMs: 1,
      });

      const result = await wrappedFn("input");

      expect(result).toEqual({ data: "test", count: 5 });
    });
  });

  describe("isRetryableError", () => {
    describe("transient errors (retryable)", () => {
      it.each([
        ["timeout", "Connection timeout"],
        ["ECONNRESET", "read ECONNRESET"],
        ["ECONNREFUSED", "connect ECONNREFUSED 127.0.0.1:3000"],
        ["socket hang up", "socket hang up"],
        ["network error", "Network error occurred"],
        ["rate limit", "Rate limit exceeded"],
        ["429", "Request failed with status 429"],
        ["500", "Internal Server Error 500"],
        ["502", "Bad Gateway 502"],
        ["503", "Service Unavailable 503"],
        ["504", "Gateway Timeout 504"],
        ["overloaded", "Server is overloaded"],
        ["temporarily unavailable", "Service temporarily unavailable"],
      ])('returns true for %s error: "%s"', (_, message) => {
        const error = new Error(message);
        expect(isRetryableError(error)).toBe(true);
      });

      it("handles case-insensitive matching", () => {
        expect(isRetryableError(new Error("TIMEOUT"))).toBe(true);
        expect(isRetryableError(new Error("Timeout"))).toBe(true);
        expect(isRetryableError(new Error("NETWORK ERROR"))).toBe(true);
      });
    });

    describe("permanent errors (not retryable)", () => {
      it.each([
        ["401", "Request failed with status 401"],
        ["unauthorized", "Unauthorized access"],
        ["403", "Request failed with status 403"],
        ["forbidden", "Access forbidden"],
        ["404", "Resource not found 404"],
        ["not found", "User not found"],
        ["invalid api key", "Invalid API key provided"],
        ["invalid_api_key", "Error: invalid_api_key"],
      ])('returns false for %s error: "%s"', (_, message) => {
        const error = new Error(message);
        expect(isRetryableError(error)).toBe(false);
      });

      it("handles case-insensitive matching for permanent errors", () => {
        expect(isRetryableError(new Error("UNAUTHORIZED"))).toBe(false);
        expect(isRetryableError(new Error("Forbidden"))).toBe(false);
        expect(isRetryableError(new Error("NOT FOUND"))).toBe(false);
      });
    });

    describe("default behavior", () => {
      it("returns true for unknown errors (defaults to retryable)", () => {
        expect(isRetryableError(new Error("Some random error"))).toBe(true);
        expect(isRetryableError(new Error("Unknown issue"))).toBe(true);
        expect(isRetryableError(new Error(""))).toBe(true);
      });
    });

    describe("priority handling", () => {
      it("permanent indicators take precedence over transient", () => {
        // An error that contains both permanent and transient indicators
        // should be treated as non-retryable
        const error = new Error("401 timeout unauthorized");
        expect(isRetryableError(error)).toBe(false);
      });
    });
  });

  describe("withSmartRetry", () => {
    describe("successful execution", () => {
      it("returns result on first attempt success", async () => {
        const fn = vi.fn().mockResolvedValue("success");

        const result = await withSmartRetry(fn, {
          agentName: "SmartAgent",
          initialDelayMs: 1,
        });

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(1);
      });
    });

    describe("retry on transient errors", () => {
      it("retries on timeout errors", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("Connection timeout"))
          .mockResolvedValue("success");

        const result = await withSmartRetry(fn, {
          agentName: "SmartAgent",
          initialDelayMs: 1,
        });

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(2);
      });

      it("retries on 503 errors", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("Service unavailable 503"))
          .mockResolvedValue("success");

        const result = await withSmartRetry(fn, {
          agentName: "SmartAgent",
          initialDelayMs: 1,
        });

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(2);
      });

      it("retries on rate limit errors", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("Rate limit exceeded"))
          .mockResolvedValue("success");

        const result = await withSmartRetry(fn, {
          agentName: "SmartAgent",
          initialDelayMs: 1,
        });

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(2);
      });
    });

    describe("fails immediately on non-retryable errors", () => {
      it("fails immediately on 401 unauthorized", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("401 Unauthorized"));

        await expect(
          withSmartRetry(fn, { agentName: "SmartAgent", initialDelayMs: 1 })
        ).rejects.toThrow(AgentRetryError);
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it("fails immediately on 403 forbidden", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("403 Forbidden"));

        await expect(
          withSmartRetry(fn, { agentName: "SmartAgent", initialDelayMs: 1 })
        ).rejects.toThrow(AgentRetryError);
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it("fails immediately on invalid API key", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("Invalid API key"));

        await expect(
          withSmartRetry(fn, { agentName: "SmartAgent", initialDelayMs: 1 })
        ).rejects.toThrow(AgentRetryError);
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it("logs non-retryable error message", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("401 Unauthorized"));

        try {
          await withSmartRetry(fn, {
            agentName: "SmartAgent",
            initialDelayMs: 1,
          });
        } catch {
          // Expected
        }

        expect(console.error).toHaveBeenCalledWith(
          "[SmartAgent] Error is not retryable, failing immediately"
        );
      });

      it("includes non-retryable error message in AgentRetryError", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("401 Unauthorized"));

        try {
          await withSmartRetry(fn, {
            agentName: "SmartAgent",
            initialDelayMs: 1,
          });
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(AgentRetryError);
          const retryError = error as AgentRetryError;
          expect(retryError.message).toContain("non-retryable error");
          expect(retryError.message).toContain("401 Unauthorized");
        }
      });
    });

    describe("exhausts retries on transient errors", () => {
      it("throws after max retries on transient errors", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("Connection timeout"));

        await expect(
          withSmartRetry(fn, {
            agentName: "SmartAgent",
            maxRetries: 3,
            initialDelayMs: 1,
          })
        ).rejects.toThrow(AgentRetryError);
        expect(fn).toHaveBeenCalledTimes(3);
      });

      it("collects all transient errors in AgentRetryError", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("Timeout 1"))
          .mockRejectedValueOnce(new Error("Timeout 2"))
          .mockRejectedValue(new Error("Timeout 3"));

        try {
          await withSmartRetry(fn, {
            agentName: "SmartAgent",
            maxRetries: 3,
            initialDelayMs: 1,
          });
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(AgentRetryError);
          const retryError = error as AgentRetryError;
          expect(retryError.errors).toHaveLength(3);
        }
      });
    });

    describe("uses exponential backoff", () => {
      it("applies correct delays between retries", async () => {
        const delays: number[] = [];
        vi.spyOn(console, "log").mockImplementation((...args) => {
          const msg = args[0] as string;
          if (typeof msg === "string" && msg.includes("Retrying in")) {
            const match = msg.match(/Retrying in (\d+)ms/);
            if (match) {
              delays.push(parseInt(match[1], 10));
            }
          }
        });

        const fn = vi
          .fn()
          .mockRejectedValueOnce(new Error("timeout"))
          .mockRejectedValueOnce(new Error("timeout"))
          .mockResolvedValue("success");

        const result = await withSmartRetry(fn, {
          agentName: "SmartAgent",
          initialDelayMs: 5,
          backoffMultiplier: 2,
          maxRetries: 3,
        });

        expect(result).toBe("success");
        // Delays should be: 5, 10 (exponential backoff)
        expect(delays).toEqual([5, 10]);
      });
    });

    describe("handles non-Error exceptions", () => {
      it("converts string errors to Error objects", async () => {
        const fn = vi
          .fn()
          .mockRejectedValueOnce("string timeout error")
          .mockResolvedValue("success");

        const result = await withSmartRetry(fn, {
          agentName: "SmartAgent",
          initialDelayMs: 1,
        });

        expect(result).toBe("success");
      });
    });
  });

  describe("integration scenarios", () => {
    it("withRetry and wrapWithRetry produce consistent behavior", async () => {
      // Test that both approaches retry the same number of times
      const directFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("direct success");

      const wrappedOriginal = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("wrapped success");

      const wrappedFn = wrapWithRetry("Wrapped", wrappedOriginal, {
        maxRetries: 2,
        initialDelayMs: 1,
      });

      const directResult = await withRetry(directFn, {
        agentName: "Direct",
        maxRetries: 2,
        initialDelayMs: 1,
      });

      const wrappedResult = await wrappedFn();

      expect(directResult).toBe("direct success");
      expect(wrappedResult).toBe("wrapped success");
      expect(directFn).toHaveBeenCalledTimes(2);
      expect(wrappedOriginal).toHaveBeenCalledTimes(2);
    });

    it("withSmartRetry stops early on permanent error mid-retry", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("timeout")) // Retry
        .mockRejectedValue(new Error("401 unauthorized")); // Stop

      await expect(
        withSmartRetry(fn, {
          agentName: "SmartAgent",
          maxRetries: 5,
          initialDelayMs: 1,
        })
      ).rejects.toThrow(AgentRetryError);

      expect(fn).toHaveBeenCalledTimes(2); // Only 2 attempts, not 5
    });
  });
});
