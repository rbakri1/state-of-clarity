/**
 * Accountability List API Route Unit Tests
 *
 * Tests for the list investigations endpoint.
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

const mockListUserInvestigations = vi.fn();

vi.mock("@/lib/services/accountability-service", () => ({
  listUserInvestigations: (...args: unknown[]) =>
    mockListUserInvestigations(...args),
}));

import { GET } from "@/app/api/accountability/route";

describe("Accountability List API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/accountability", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest("http://localhost/api/accountability");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return investigations array for authenticated user", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      const mockInvestigations = [
        {
          id: "inv-1",
          target_entity: "Entity A",
          user_id: "user-123",
          created_at: "2026-01-15T10:00:00Z",
          quality_score: 7.5,
        },
        {
          id: "inv-2",
          target_entity: "Entity B",
          user_id: "user-123",
          created_at: "2026-01-14T10:00:00Z",
          quality_score: 8.0,
        },
      ];

      mockListUserInvestigations.mockResolvedValue(mockInvestigations);

      const request = new NextRequest("http://localhost/api/accountability");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.investigations).toEqual(mockInvestigations);
      expect(mockListUserInvestigations).toHaveBeenCalledWith("user-123", 50);
    });

    it("should return empty array when no investigations exist", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-456", email: "new@example.com" } },
      });

      mockListUserInvestigations.mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/accountability");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.investigations).toEqual([]);
      expect(Array.isArray(data.investigations)).toBe(true);
    });

    it("should call listUserInvestigations with correct user ID and limit", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-789" } },
      });

      mockListUserInvestigations.mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/accountability");
      await GET(request);

      expect(mockListUserInvestigations).toHaveBeenCalledTimes(1);
      expect(mockListUserInvestigations).toHaveBeenCalledWith("user-789", 50);
    });
  });
});
