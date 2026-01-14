/**
 * Accountability Export API Route Unit Tests
 *
 * Tests for the export redirect endpoint.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    })
  ),
}));

const mockGetInvestigation = vi.fn();

vi.mock("@/lib/services/accountability-service", () => ({
  getInvestigation: (...args: unknown[]) => mockGetInvestigation(...args),
}));

import { GET } from "@/app/api/accountability/[id]/export/route";

describe("Accountability Export API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/accountability/[id]/export", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/inv-123/export"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "inv-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 when investigation not found", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      mockGetInvestigation.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost/api/accountability/nonexistent/export"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Investigation not found");
    });

    it("should return 403 when user doesn't own investigation", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      mockGetInvestigation.mockResolvedValue({
        id: "inv-456",
        target_entity: "Entity A",
        user_id: "other-user",
        created_at: "2026-01-15T10:00:00Z",
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/inv-456/export"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "inv-456" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should redirect to /accountability/{id}/print for owner", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      mockGetInvestigation.mockResolvedValue({
        id: "inv-123",
        target_entity: "Entity A",
        user_id: "user-123",
        created_at: "2026-01-15T10:00:00Z",
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/inv-123/export"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "inv-123" }),
      });

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toContain(
        "/accountability/inv-123/print"
      );
    });

    it("should use 302 redirect status", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-456", email: "owner@example.com" } },
      });

      mockGetInvestigation.mockResolvedValue({
        id: "inv-789",
        target_entity: "Entity B",
        user_id: "user-456",
        created_at: "2026-01-14T10:00:00Z",
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/inv-789/export"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "inv-789" }),
      });

      expect(response.status).toBe(302);
    });

    it("should call getInvestigation with correct ID", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      mockGetInvestigation.mockResolvedValue({
        id: "test-inv-id",
        target_entity: "Entity C",
        user_id: "user-123",
        created_at: "2026-01-13T10:00:00Z",
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/test-inv-id/export"
      );
      await GET(request, {
        params: Promise.resolve({ id: "test-inv-id" }),
      });

      expect(mockGetInvestigation).toHaveBeenCalledWith("test-inv-id");
    });
  });
});
