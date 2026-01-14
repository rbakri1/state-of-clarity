/**
 * Accountability Fetch API Route Unit Tests
 *
 * Tests for the fetch single investigation endpoint.
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
const mockGetInvestigationSources = vi.fn();

vi.mock("@/lib/services/accountability-service", () => ({
  getInvestigation: (...args: unknown[]) => mockGetInvestigation(...args),
  getInvestigationSources: (...args: unknown[]) =>
    mockGetInvestigationSources(...args),
}));

import { GET } from "@/app/api/accountability/[id]/route";

describe("Accountability Fetch API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/accountability/[id]", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/inv-123"
      );
      const response = await GET(request, { params: Promise.resolve({ id: "inv-123" }) });
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
        "http://localhost/api/accountability/nonexistent"
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
        quality_score: 7.5,
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/inv-456"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "inv-456" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return investigation with sources for owner", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      const mockInvestigation = {
        id: "inv-123",
        target_entity: "Entity A",
        user_id: "user-123",
        created_at: "2026-01-15T10:00:00Z",
        quality_score: 8.0,
        report: "Investigation report content",
      };

      const mockSources = [
        { id: "src-1", url: "https://example.com/1", title: "Source 1" },
        { id: "src-2", url: "https://example.com/2", title: "Source 2" },
      ];

      mockGetInvestigation.mockResolvedValue(mockInvestigation);
      mockGetInvestigationSources.mockResolvedValue(mockSources);

      const request = new NextRequest(
        "http://localhost/api/accountability/inv-123"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "inv-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.investigation).toEqual({
        ...mockInvestigation,
        sources: mockSources,
      });
      expect(mockGetInvestigation).toHaveBeenCalledWith("inv-123");
      expect(mockGetInvestigationSources).toHaveBeenCalledWith("inv-123");
    });

    it("should include sources array in response", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-456", email: "owner@example.com" } },
      });

      const mockInvestigation = {
        id: "inv-789",
        target_entity: "Entity B",
        user_id: "user-456",
        created_at: "2026-01-14T10:00:00Z",
        quality_score: 7.0,
      };

      const mockSources = [
        { id: "src-3", url: "https://example.com/3", title: "Source 3" },
      ];

      mockGetInvestigation.mockResolvedValue(mockInvestigation);
      mockGetInvestigationSources.mockResolvedValue(mockSources);

      const request = new NextRequest(
        "http://localhost/api/accountability/inv-789"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "inv-789" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.investigation.sources)).toBe(true);
      expect(data.investigation.sources).toEqual(mockSources);
    });

    it("should return empty sources array when investigation has no sources", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      const mockInvestigation = {
        id: "inv-nosrc",
        target_entity: "Entity C",
        user_id: "user-123",
        created_at: "2026-01-13T10:00:00Z",
        quality_score: 6.5,
      };

      mockGetInvestigation.mockResolvedValue(mockInvestigation);
      mockGetInvestigationSources.mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost/api/accountability/inv-nosrc"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "inv-nosrc" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.investigation.sources).toEqual([]);
    });
  });
});
