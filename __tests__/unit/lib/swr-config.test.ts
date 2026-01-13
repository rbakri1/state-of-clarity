/**
 * Tests for lib/swr/config.ts
 *
 * Tests the SWR configuration object.
 */

import { describe, it, expect } from "vitest";
import { swrConfig } from "@/lib/swr/config";
import { fetcher } from "@/lib/swr/fetcher";

describe("swr/config", () => {
  describe("swrConfig", () => {
    it("exports a configuration object", () => {
      expect(swrConfig).toBeDefined();
      expect(typeof swrConfig).toBe("object");
    });

    it("uses the fetcher from swr/fetcher", () => {
      expect(swrConfig.fetcher).toBe(fetcher);
    });

    describe("revalidation settings", () => {
      it("revalidates on focus", () => {
        expect(swrConfig.revalidateOnFocus).toBe(true);
      });

      it("revalidates on reconnect", () => {
        expect(swrConfig.revalidateOnReconnect).toBe(true);
      });
    });

    describe("deduplication", () => {
      it("has a deduping interval", () => {
        expect(swrConfig.dedupingInterval).toBeDefined();
        expect(typeof swrConfig.dedupingInterval).toBe("number");
      });

      it("deduping interval is 2 seconds", () => {
        expect(swrConfig.dedupingInterval).toBe(2000);
      });
    });

    describe("error retry settings", () => {
      it("has error retry count configured", () => {
        expect(swrConfig.errorRetryCount).toBeDefined();
        expect(typeof swrConfig.errorRetryCount).toBe("number");
      });

      it("retries 3 times on error", () => {
        expect(swrConfig.errorRetryCount).toBe(3);
      });

      it("has error retry interval configured", () => {
        expect(swrConfig.errorRetryInterval).toBeDefined();
        expect(typeof swrConfig.errorRetryInterval).toBe("number");
      });

      it("waits 5 seconds between retries", () => {
        expect(swrConfig.errorRetryInterval).toBe(5000);
      });
    });

    describe("configuration is suitable for production", () => {
      it("has reasonable revalidation for user experience", () => {
        // Revalidating on focus ensures fresh data when user returns to tab
        expect(swrConfig.revalidateOnFocus).toBe(true);
      });

      it("has reasonable deduping to prevent excessive requests", () => {
        // 2 seconds is reasonable to prevent duplicate requests
        expect(swrConfig.dedupingInterval).toBeGreaterThanOrEqual(1000);
        expect(swrConfig.dedupingInterval).toBeLessThanOrEqual(5000);
      });

      it("has reasonable retry settings for resilience", () => {
        // 3 retries with 5 second intervals is reasonable for transient failures
        expect(swrConfig.errorRetryCount).toBeGreaterThanOrEqual(2);
        expect(swrConfig.errorRetryCount).toBeLessThanOrEqual(5);
        expect(swrConfig.errorRetryInterval).toBeGreaterThanOrEqual(1000);
      });
    });
  });
});
