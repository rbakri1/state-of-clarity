/**
 * Tests for lib/errors/error-messages.ts
 *
 * Tests the user-friendly error message utilities.
 */

import { describe, it, expect } from "vitest";
import { getFriendlyError, getErrorByStatusCode } from "@/lib/errors/error-messages";
import { ErrorCodes } from "@/lib/errors/api-error";

describe("error-messages", () => {
  describe("getFriendlyError", () => {
    it("returns UNKNOWN error for null code", () => {
      const result = getFriendlyError(null);

      expect(result.title).toBe("Something Went Wrong");
      expect(result.message).toContain("unexpected error");
    });

    it("returns UNKNOWN error for undefined code", () => {
      const result = getFriendlyError(undefined);

      expect(result.title).toBe("Something Went Wrong");
      expect(result.message).toContain("unexpected error");
    });

    it("returns UNAUTHORIZED error for UNAUTHORIZED code", () => {
      const result = getFriendlyError(ErrorCodes.UNAUTHORIZED);

      expect(result.title).toBe("Access Denied");
      expect(result.message).toContain("sign in");
    });

    it("returns NOT_FOUND error for NOT_FOUND code", () => {
      const result = getFriendlyError(ErrorCodes.NOT_FOUND);

      expect(result.title).toBe("Not Found");
      expect(result.message).toContain("couldn't find");
    });

    it("returns VALIDATION_ERROR for VALIDATION_ERROR code", () => {
      const result = getFriendlyError(ErrorCodes.VALIDATION_ERROR);

      expect(result.title).toBe("Invalid Input");
      expect(result.message).toContain("check your input");
    });

    it("returns RATE_LIMITED error for RATE_LIMITED code", () => {
      const result = getFriendlyError(ErrorCodes.RATE_LIMITED);

      expect(result.title).toBe("Too Many Requests");
      expect(result.message).toContain("too many requests");
    });

    it("returns SERVICE_UNAVAILABLE error for SERVICE_UNAVAILABLE code", () => {
      const result = getFriendlyError(ErrorCodes.SERVICE_UNAVAILABLE);

      expect(result.title).toBe("Service Unavailable");
      expect(result.message).toContain("technical difficulties");
    });

    it("returns NETWORK_ERROR for NETWORK_ERROR code", () => {
      const result = getFriendlyError("NETWORK_ERROR");

      expect(result.title).toBe("Connection Error");
      expect(result.message).toContain("internet connection");
    });

    it("returns AI_SERVICE_ERROR for AI_SERVICE_ERROR code", () => {
      const result = getFriendlyError("AI_SERVICE_ERROR");

      expect(result.title).toBe("AI Service Unavailable");
      expect(result.message).toContain("AI service");
    });

    it("returns PAYMENT_SERVICE_ERROR for PAYMENT_SERVICE_ERROR code", () => {
      const result = getFriendlyError("PAYMENT_SERVICE_ERROR");

      expect(result.title).toBe("Payment Service Unavailable");
      expect(result.message).toContain("payment service");
    });

    it("returns UNKNOWN error for unrecognized code", () => {
      const result = getFriendlyError("SOME_RANDOM_CODE");

      expect(result.title).toBe("Something Went Wrong");
      expect(result.message).toContain("unexpected error");
    });

    it("returns UNKNOWN error for empty string", () => {
      const result = getFriendlyError("");

      expect(result.title).toBe("Something Went Wrong");
    });
  });

  describe("getErrorByStatusCode", () => {
    describe("authentication errors", () => {
      it("returns UNAUTHORIZED for 401", () => {
        const result = getErrorByStatusCode(401);

        expect(result.title).toBe("Access Denied");
        expect(result.message).toContain("sign in");
      });

      it("returns UNAUTHORIZED for 403", () => {
        const result = getErrorByStatusCode(403);

        expect(result.title).toBe("Access Denied");
      });
    });

    describe("not found errors", () => {
      it("returns NOT_FOUND for 404", () => {
        const result = getErrorByStatusCode(404);

        expect(result.title).toBe("Not Found");
        expect(result.message).toContain("couldn't find");
      });
    });

    describe("validation errors", () => {
      it("returns VALIDATION_ERROR for 400", () => {
        const result = getErrorByStatusCode(400);

        expect(result.title).toBe("Invalid Input");
        expect(result.message).toContain("check your input");
      });

      it("returns VALIDATION_ERROR for 422", () => {
        const result = getErrorByStatusCode(422);

        expect(result.title).toBe("Invalid Input");
      });
    });

    describe("rate limiting errors", () => {
      it("returns RATE_LIMITED for 429", () => {
        const result = getErrorByStatusCode(429);

        expect(result.title).toBe("Too Many Requests");
        expect(result.message).toContain("too many requests");
      });
    });

    describe("server errors", () => {
      it("returns SERVICE_UNAVAILABLE for 500", () => {
        const result = getErrorByStatusCode(500);

        expect(result.title).toBe("Service Unavailable");
        expect(result.message).toContain("technical difficulties");
      });

      it("returns SERVICE_UNAVAILABLE for 502", () => {
        const result = getErrorByStatusCode(502);

        expect(result.title).toBe("Service Unavailable");
      });

      it("returns SERVICE_UNAVAILABLE for 503", () => {
        const result = getErrorByStatusCode(503);

        expect(result.title).toBe("Service Unavailable");
      });

      it("returns SERVICE_UNAVAILABLE for 504", () => {
        const result = getErrorByStatusCode(504);

        expect(result.title).toBe("Service Unavailable");
      });
    });

    describe("unknown status codes", () => {
      it("returns UNKNOWN for unrecognized status codes", () => {
        const result = getErrorByStatusCode(418);

        expect(result.title).toBe("Something Went Wrong");
        expect(result.message).toContain("unexpected error");
      });

      it("returns UNKNOWN for status code 0", () => {
        const result = getErrorByStatusCode(0);

        expect(result.title).toBe("Something Went Wrong");
      });

      it("returns UNKNOWN for negative status codes", () => {
        const result = getErrorByStatusCode(-1);

        expect(result.title).toBe("Something Went Wrong");
      });
    });
  });

  describe("error message structure", () => {
    it("all error messages have title and message properties", () => {
      const codes = [
        ErrorCodes.UNAUTHORIZED,
        ErrorCodes.NOT_FOUND,
        ErrorCodes.VALIDATION_ERROR,
        ErrorCodes.RATE_LIMITED,
        ErrorCodes.SERVICE_UNAVAILABLE,
        "NETWORK_ERROR",
        "AI_SERVICE_ERROR",
        "PAYMENT_SERVICE_ERROR",
        "UNKNOWN",
      ];

      codes.forEach((code) => {
        const error = getFriendlyError(code);
        expect(error).toHaveProperty("title");
        expect(error).toHaveProperty("message");
        expect(typeof error.title).toBe("string");
        expect(typeof error.message).toBe("string");
        expect(error.title.length).toBeGreaterThan(0);
        expect(error.message.length).toBeGreaterThan(0);
      });
    });

    it("error messages are user-friendly (no technical jargon)", () => {
      const statusCodes = [401, 403, 404, 400, 429, 500, 502, 503, 504];

      statusCodes.forEach((statusCode) => {
        const error = getErrorByStatusCode(statusCode);
        // Should not contain HTTP status code numbers in the message
        expect(error.message).not.toContain(statusCode.toString());
        // Should not contain technical terms
        expect(error.message.toLowerCase()).not.toContain("http");
        expect(error.message.toLowerCase()).not.toContain("status code");
      });
    });
  });
});
