/**
 * Brief by ID API Route Unit Tests
 *
 * Tests for fetching a single brief by ID.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the brief service
const mockGetBriefById = vi.fn();

vi.mock('@/lib/services/brief-service', () => ({
  getBriefById: (...args: any[]) => mockGetBriefById(...args),
}));

import { GET } from '@/app/api/briefs/[id]/route';

describe('Brief by ID API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/briefs/[id]', () => {
    it('should return brief when found', async () => {
      const mockBrief = {
        id: 'brief-123',
        question: 'Test question',
        narrative: 'Test narrative',
        clarity_score: 8.5,
      };

      mockGetBriefById.mockResolvedValue({
        data: mockBrief,
        error: null,
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123');
      const response = await GET(request, { params: { id: 'brief-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.brief).toEqual(mockBrief);
    });

    it('should return 404 when brief not found', async () => {
      mockGetBriefById.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest('http://localhost/api/briefs/nonexistent');
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Brief not found');
    });

    it('should return 500 on service error', async () => {
      mockGetBriefById.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123');
      const response = await GET(request, { params: { id: 'brief-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should return 400 when ID is missing', async () => {
      const request = new NextRequest('http://localhost/api/briefs/');
      const response = await GET(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });
});
