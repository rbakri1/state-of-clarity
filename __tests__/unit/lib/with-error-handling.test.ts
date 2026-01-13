/**
 * Tests for lib/errors/with-error-handling.ts
 *
 * Tests the error handling wrapper for API routes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/errors/with-error-handling";
import { ApiError, ErrorCodes } from "@/lib/errors/api-error";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("with-error-handling", () => {
  let mockSentry: { captureException: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    const sentryModule = await import("@sentry/nextjs");
    mockSentry = sentryModule as unknown as typeof mockSentry;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createMockRequest(
    path: string = "/api/test",
    method: string = "GET"
  ): NextRequest {
    return {
      nextUrl: { pathname: path },
      method,
    } as unknown as NextRequest;
  }

  describe("successful requests", () => {
    it("returns handler response when no error occurs", async () => {
      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(data).toEqual({ success: true });
      expect(handler).toHaveBeenCalledWith(request, undefined);
    });

    it("passes context to handler", async () => {
      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ id: "123" })
      );
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();
      const context = { params: { id: "123" } };

      await wrappedHandler(request, context);

      expect(handler).toHaveBeenCalledWith(request, context);
    });

    it("does not capture exception for successful requests", async () => {
      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      await wrappedHandler(request);

      expect(mockSentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe("ApiError handling", () => {
    it("returns formatted error response for ApiError", async () => {
      const apiError = ApiError.notFound("Resource not found");
      const handler = vi.fn().mockRejectedValue(apiError);
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(data.error.message).toBe("Resource not found");
    });

    it("captures ApiError to Sentry with warning level for client errors", async () => {
      const apiError = ApiError.validationError("Invalid input");
      const handler = vi.fn().mockRejectedValue(apiError);
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest("/api/users", "POST");

      await wrappedHandler(request);

      expect(mockSentry.captureException).toHaveBeenCalledWith(
        apiError,
        expect.objectContaining({
          level: "warning",
          extra: expect.objectContaining({
            code: ErrorCodes.VALIDATION_ERROR,
            statusCode: 400,
            path: "/api/users",
            method: "POST",
          }),
        })
      );
    });

    it("captures ApiError to Sentry with error level for server errors", async () => {
      const apiError = ApiError.serviceUnavailable("Service down");
      const handler = vi.fn().mockRejectedValue(apiError);
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      await wrappedHandler(request);

      expect(mockSentry.captureException).toHaveBeenCalledWith(
        apiError,
        expect.objectContaining({
          level: "error",
        })
      );
    });

    it("includes details in Sentry extra data", async () => {
      const apiError = ApiError.validationError("Invalid", {
        field: "email",
        issue: "Invalid format",
      });
      const handler = vi.fn().mockRejectedValue(apiError);
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      await wrappedHandler(request);

      expect(mockSentry.captureException).toHaveBeenCalledWith(
        apiError,
        expect.objectContaining({
          extra: expect.objectContaining({
            details: { field: "email", issue: "Invalid format" },
          }),
        })
      );
    });

    it("handles unauthorized errors correctly", async () => {
      const apiError = ApiError.unauthorized("Not logged in");
      const handler = vi.fn().mockRejectedValue(apiError);
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
    });

    it("handles rate limited errors correctly", async () => {
      const apiError = ApiError.rateLimited("Too many requests");
      const handler = vi.fn().mockRejectedValue(apiError);
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);

      expect(response.status).toBe(429);
    });
  });

  describe("unexpected error handling", () => {
    it("converts unexpected Error to service unavailable response", async () => {
      const error = new Error("Database connection failed");
      const handler = vi.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error.code).toBe(ErrorCodes.SERVICE_UNAVAILABLE);
      expect(data.error.message).toContain("unexpected error");
    });

    it("captures unexpected error to Sentry with error level", async () => {
      const error = new Error("Something broke");
      const handler = vi.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest("/api/briefs", "GET");

      await wrappedHandler(request);

      expect(mockSentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: "error",
          extra: expect.objectContaining({
            path: "/api/briefs",
            method: "GET",
          }),
        })
      );
    });

    it("handles string errors", async () => {
      const handler = vi.fn().mockRejectedValue("String error");
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);

      expect(response.status).toBe(503);
    });

    it("handles null/undefined errors", async () => {
      const handler = vi.fn().mockRejectedValue(null);
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);

      expect(response.status).toBe(503);
    });

    it("handles object errors", async () => {
      const handler = vi.fn().mockRejectedValue({ code: "CUSTOM_ERROR" });
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);

      expect(response.status).toBe(503);
    });
  });

  describe("synchronous handlers", () => {
    it("handles synchronous handlers that return NextResponse directly", async () => {
      const handler = vi.fn().mockReturnValue(
        NextResponse.json({ sync: true })
      );
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(data).toEqual({ sync: true });
    });

    it("handles synchronous handlers that throw", async () => {
      const handler = vi.fn().mockImplementation(() => {
        throw new Error("Sync error");
      });
      const wrappedHandler = withErrorHandling(handler);
      const request = createMockRequest();

      const response = await wrappedHandler(request);

      expect(response.status).toBe(503);
    });
  });
});
