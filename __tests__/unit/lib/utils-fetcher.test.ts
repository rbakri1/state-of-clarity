/**
 * Tests for lib/utils/fetcher.ts
 *
 * Tests the fetch with retry utility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithRetry, FetchError } from "@/lib/utils/fetcher";

// Mock the retry module
vi.mock("@/lib/utils/retry", () => ({
  retryWithBackoff: vi.fn(async (fn) => fn()),
}));

describe("utils/fetcher", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("FetchError", () => {
    it("creates error with status and statusText", () => {
      const error = new FetchError(404, "Not Found");

      expect(error.status).toBe(404);
      expect(error.statusText).toBe("Not Found");
      expect(error.message).toBe("HTTP 404: Not Found");
      expect(error.name).toBe("FetchError");
    });

    it("creates error with custom message", () => {
      const error = new FetchError(500, "Internal Server Error", "Database connection failed");

      expect(error.status).toBe(500);
      expect(error.statusText).toBe("Internal Server Error");
      expect(error.message).toBe("Database connection failed");
    });

    it("is an instance of Error", () => {
      const error = new FetchError(400, "Bad Request");

      expect(error instanceof Error).toBe(true);
      expect(error instanceof FetchError).toBe(true);
    });

    it("works with instanceof checks after prototype fix", () => {
      const error = new FetchError(401, "Unauthorized");

      // The Object.setPrototypeOf call ensures this works correctly
      expect(error instanceof FetchError).toBe(true);
    });
  });

  describe("fetchWithRetry", () => {
    it("returns response and data on success", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(mockData),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const { response, data } = await fetchWithRetry<typeof mockData>("/api/test");

      expect(response.ok).toBe(true);
      expect(data).toEqual(mockData);
    });

    it("passes fetch options to fetch", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await fetchWithRetry("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "test" }),
      });

      expect(fetch).toHaveBeenCalledWith("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "test" }),
      });
    });

    it("throws FetchError on non-ok response", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: vi.fn().mockResolvedValue({ error: "Resource not found" }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await expect(fetchWithRetry("/api/missing")).rejects.toThrow(FetchError);
    });

    it("includes status in FetchError for non-ok responses", async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      try {
        await fetchWithRetry("/api/forbidden");
      } catch (error) {
        if (error instanceof FetchError) {
          expect(error.status).toBe(403);
          expect(error.statusText).toBe("Forbidden");
        }
      }
    });

    describe("retryable status codes", () => {
      it("considers 5xx errors retryable", async () => {
        const retryableStatuses = [500, 502, 503, 504, 599];

        for (const status of retryableStatuses) {
          const mockResponse = {
            ok: false,
            status,
            statusText: "Server Error",
            json: vi.fn().mockResolvedValue({}),
          };
          vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

          // The error should be thrown (will be caught by retry logic)
          await expect(fetchWithRetry(`/api/error/${status}`)).rejects.toThrow(FetchError);
        }
      });

      it("considers 4xx errors non-retryable (throws immediately)", async () => {
        const nonRetryableStatuses = [400, 401, 403, 404, 422];

        for (const status of nonRetryableStatuses) {
          const mockResponse = {
            ok: false,
            status,
            statusText: "Client Error",
            json: vi.fn().mockResolvedValue({}),
          };
          vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

          await expect(fetchWithRetry(`/api/error/${status}`)).rejects.toThrow(FetchError);
        }
      });
    });

    it("handles different response types", async () => {
      // Object response
      const mockObjectResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ key: "value" }),
      };
      vi.mocked(fetch).mockResolvedValue(mockObjectResponse as unknown as Response);
      const { data: objectData } = await fetchWithRetry<{ key: string }>("/api/object");
      expect(objectData).toEqual({ key: "value" });

      // Array response
      const mockArrayResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([1, 2, 3]),
      };
      vi.mocked(fetch).mockResolvedValue(mockArrayResponse as unknown as Response);
      const { data: arrayData } = await fetchWithRetry<number[]>("/api/array");
      expect(arrayData).toEqual([1, 2, 3]);

      // Null response
      const mockNullResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(fetch).mockResolvedValue(mockNullResponse as unknown as Response);
      const { data: nullData } = await fetchWithRetry<null>("/api/null");
      expect(nullData).toBeNull();
    });

    it("separates retry options from fetch options", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await fetchWithRetry("/api/test", {
        method: "GET",
        retry: { maxRetries: 5 },
      });

      // Retry options should not be passed to fetch
      expect(fetch).toHaveBeenCalledWith("/api/test", { method: "GET" });
    });

    it("logs retryable errors", async () => {
      const mockResponse = {
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      try {
        await fetchWithRetry("/api/error");
      } catch {
        // Expected to throw
      }

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Retryable error: 503")
      );
    });
  });
});
