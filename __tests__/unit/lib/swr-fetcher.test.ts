/**
 * Tests for lib/swr/fetcher.ts
 *
 * Tests the SWR fetcher utility and FetchError class.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetcher, FetchError } from "@/lib/swr/fetcher";

describe("swr/fetcher", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("FetchError", () => {
    it("creates error with all properties", () => {
      const error = new FetchError("Failed to fetch", 404, { reason: "not_found" });

      expect(error.message).toBe("Failed to fetch");
      expect(error.status).toBe(404);
      expect(error.info).toEqual({ reason: "not_found" });
      expect(error.name).toBe("FetchError");
    });

    it("creates error without info", () => {
      const error = new FetchError("Server error", 500);

      expect(error.message).toBe("Server error");
      expect(error.status).toBe(500);
      expect(error.info).toBeUndefined();
    });

    it("is an instance of Error", () => {
      const error = new FetchError("Error", 400);

      expect(error instanceof Error).toBe(true);
      expect(error instanceof FetchError).toBe(true);
    });
  });

  describe("fetcher", () => {
    it("returns data on successful response", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await fetcher<typeof mockData>("/api/test");

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith("/api/test");
    });

    it("throws FetchError on non-ok response with JSON body", async () => {
      const errorInfo = { error: "Not found", code: "RESOURCE_NOT_FOUND" };
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue(errorInfo),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await expect(fetcher("/api/missing")).rejects.toThrow(FetchError);

      try {
        await fetcher("/api/missing");
      } catch (error) {
        if (error instanceof FetchError) {
          expect(error.status).toBe(404);
          expect(error.info).toEqual(errorInfo);
        }
      }
    });

    it("throws FetchError with text body when JSON parsing fails", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        text: vi.fn().mockResolvedValue("Internal Server Error"),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      try {
        await fetcher("/api/error");
      } catch (error) {
        if (error instanceof FetchError) {
          expect(error.status).toBe(500);
          expect(error.info).toBe("Internal Server Error");
        }
      }
    });

    it("handles various HTTP status codes", async () => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];

      for (const status of statusCodes) {
        const mockResponse = {
          ok: false,
          status,
          json: vi.fn().mockResolvedValue({ status }),
        };
        vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

        try {
          await fetcher(`/api/status/${status}`);
        } catch (error) {
          if (error instanceof FetchError) {
            expect(error.status).toBe(status);
          }
        }
      }
    });

    it("handles empty JSON response", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await fetcher("/api/empty");

      expect(result).toBeNull();
    });

    it("handles array response", async () => {
      const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await fetcher<typeof mockData>("/api/list");

      expect(result).toEqual(mockData);
      expect(result).toHaveLength(3);
    });

    it("propagates network errors", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      await expect(fetcher("/api/network-fail")).rejects.toThrow("Network error");
    });

    it("works with generic types", async () => {
      interface User {
        id: number;
        email: string;
        name: string;
      }

      const mockUser: User = { id: 1, email: "test@example.com", name: "Test User" };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockUser),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await fetcher<User>("/api/user/1");

      expect(result.id).toBe(1);
      expect(result.email).toBe("test@example.com");
      expect(result.name).toBe("Test User");
    });
  });
});
