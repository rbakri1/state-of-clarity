/**
 * Tests for lib/errors/api-error.ts
 *
 * Tests the API error classes and formatting utilities.
 */

import { describe, it, expect } from "vitest";
import {
  ApiError,
  ErrorCodes,
  formatErrorResponse,
} from "@/lib/errors/api-error";

describe("api-error", () => {
  describe("ErrorCodes", () => {
    it("has all expected error codes", () => {
      expect(ErrorCodes.UNAUTHORIZED).toBe("UNAUTHORIZED");
      expect(ErrorCodes.NOT_FOUND).toBe("NOT_FOUND");
      expect(ErrorCodes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(ErrorCodes.RATE_LIMITED).toBe("RATE_LIMITED");
      expect(ErrorCodes.SERVICE_UNAVAILABLE).toBe("SERVICE_UNAVAILABLE");
    });
  });

  describe("ApiError", () => {
    describe("constructor", () => {
      it("creates an error with all properties", () => {
        const error = new ApiError(
          404,
          "Resource not found",
          ErrorCodes.NOT_FOUND,
          { field: "id" }
        );

        expect(error.statusCode).toBe(404);
        expect(error.message).toBe("Resource not found");
        expect(error.code).toBe(ErrorCodes.NOT_FOUND);
        expect(error.details).toEqual({ field: "id" });
        expect(error.name).toBe("ApiError");
      });

      it("creates an error without details", () => {
        const error = new ApiError(500, "Server error", ErrorCodes.SERVICE_UNAVAILABLE);

        expect(error.statusCode).toBe(500);
        expect(error.details).toBeUndefined();
      });

      it("is an instance of Error", () => {
        const error = new ApiError(400, "Bad request", ErrorCodes.VALIDATION_ERROR);
        expect(error instanceof Error).toBe(true);
        expect(error instanceof ApiError).toBe(true);
      });
    });

    describe("static factory methods", () => {
      describe("unauthorized", () => {
        it("creates a 401 error with default message", () => {
          const error = ApiError.unauthorized();

          expect(error.statusCode).toBe(401);
          expect(error.message).toBe("Unauthorized");
          expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
        });

        it("creates a 401 error with custom message", () => {
          const error = ApiError.unauthorized("Invalid token");

          expect(error.statusCode).toBe(401);
          expect(error.message).toBe("Invalid token");
        });

        it("creates a 401 error with details", () => {
          const error = ApiError.unauthorized("Session expired", {
            reason: "token_expired",
          });

          expect(error.details).toEqual({ reason: "token_expired" });
        });
      });

      describe("notFound", () => {
        it("creates a 404 error with default message", () => {
          const error = ApiError.notFound();

          expect(error.statusCode).toBe(404);
          expect(error.message).toBe("Resource not found");
          expect(error.code).toBe(ErrorCodes.NOT_FOUND);
        });

        it("creates a 404 error with custom message", () => {
          const error = ApiError.notFound("Brief not found");

          expect(error.message).toBe("Brief not found");
        });

        it("creates a 404 error with details", () => {
          const error = ApiError.notFound("Brief not found", {
            field: "briefId",
          });

          expect(error.details).toEqual({ field: "briefId" });
        });
      });

      describe("validationError", () => {
        it("creates a 400 error with default message", () => {
          const error = ApiError.validationError();

          expect(error.statusCode).toBe(400);
          expect(error.message).toBe("Validation failed");
          expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
        });

        it("creates a 400 error with custom message and details", () => {
          const error = ApiError.validationError("Invalid email format", {
            field: "email",
            reason: "invalid_format",
          });

          expect(error.message).toBe("Invalid email format");
          expect(error.details).toEqual({
            field: "email",
            reason: "invalid_format",
          });
        });
      });

      describe("rateLimited", () => {
        it("creates a 429 error with default message", () => {
          const error = ApiError.rateLimited();

          expect(error.statusCode).toBe(429);
          expect(error.message).toBe("Rate limit exceeded");
          expect(error.code).toBe(ErrorCodes.RATE_LIMITED);
        });

        it("creates a 429 error with retry info", () => {
          const error = ApiError.rateLimited("Too many requests", {
            retryAfter: 60,
          });

          expect(error.details).toEqual({ retryAfter: 60 });
        });
      });

      describe("serviceUnavailable", () => {
        it("creates a 503 error with default message", () => {
          const error = ApiError.serviceUnavailable();

          expect(error.statusCode).toBe(503);
          expect(error.message).toBe("Service temporarily unavailable");
          expect(error.code).toBe(ErrorCodes.SERVICE_UNAVAILABLE);
        });

        it("creates a 503 error with custom message", () => {
          const error = ApiError.serviceUnavailable("AI service down");

          expect(error.message).toBe("AI service down");
        });
      });
    });
  });

  describe("formatErrorResponse", () => {
    it("formats an error without details", () => {
      const error = new ApiError(404, "Not found", ErrorCodes.NOT_FOUND);
      const response = formatErrorResponse(error);

      expect(response).toEqual({
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: "Not found",
        },
      });
    });

    it("formats an error with details", () => {
      const error = new ApiError(400, "Validation failed", ErrorCodes.VALIDATION_ERROR, {
        field: "email",
        reason: "invalid",
      });
      const response = formatErrorResponse(error);

      expect(response).toEqual({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: "Validation failed",
          details: {
            field: "email",
            reason: "invalid",
          },
        },
      });
    });

    it("formats factory-created errors correctly", () => {
      const error = ApiError.unauthorized("Token expired", { reason: "expired" });
      const response = formatErrorResponse(error);

      expect(response.error.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(response.error.message).toBe("Token expired");
      expect(response.error.details).toEqual({ reason: "expired" });
    });
  });
});
