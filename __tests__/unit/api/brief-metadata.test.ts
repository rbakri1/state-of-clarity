/**
 * Brief Metadata API Route Unit Tests
 *
 * Tests for the brief metadata debug endpoint that returns OpenGraph/Twitter card metadata.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock brief service
const mockGetBriefById = vi.fn();

vi.mock('@/lib/services/brief-service', () => ({
  getBriefById: (...args: unknown[]) => mockGetBriefById(...args),
}));

// Mock sample briefs
vi.mock('@/sample-briefs/uk-four-day-week.json', () => ({
  default: {
    question: 'Should the UK adopt a four-day work week?',
    clarity_score: 85,
    summaries: {
      undergrad: 'This is a summary about the four-day work week policy.',
      teen: 'Teen summary about four-day week.',
    },
  },
}));

vi.mock('@/sample-briefs/what-is-a-state.json', () => ({
  default: {
    question: 'What is a state?',
    clarity_score: 90,
    summaries: {
      undergrad: 'A state is a political entity with sovereignty.',
    },
  },
}));

vi.mock('@/sample-briefs/medicare-for-all.json', () => ({
  default: {
    question: 'Should the US adopt Medicare for All?',
    clarity_score: 78,
    summaries: {
      teen: 'Medicare for All is a healthcare proposal.',
    },
  },
}));

vi.mock('@/sample-briefs/uk-ban-conversion-therapy.json', () => ({
  default: {
    question: 'Should the UK ban conversion therapy?',
    clarity_score: 82,
    summaries: {
      undergrad: 'Conversion therapy debate summary.',
    },
  },
}));

vi.mock('@/sample-briefs/uk-mandatory-voting.json', () => ({
  default: {
    question: 'Should the UK introduce mandatory voting?',
    clarity_score: 75,
    summaries: {
      undergrad: 'Mandatory voting summary.',
    },
  },
}));

vi.mock('@/sample-briefs/uk-rent-controls.json', () => ({
  default: {
    question: 'Should the UK introduce rent controls?',
    clarity_score: 70,
    summaries: {
      undergrad: 'Rent controls summary.',
    },
  },
}));

vi.mock('@/sample-briefs/uk-scotland-independence-economics.json', () => ({
  default: {
    question: 'What are the economic implications of Scottish independence?',
    clarity_score: 88,
    summaries: {
      undergrad: 'Scottish independence economics summary.',
    },
  },
}));

describe('Brief Metadata API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NEXT_PUBLIC_BASE_URL = 'https://stateofclarity.org';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  describe('GET /api/brief-metadata/[id]', () => {
    it('should return metadata for a sample brief by slug', async () => {
      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/uk-four-day-week');
      const response = await GET(request, { params: { id: 'uk-four-day-week' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.briefId).toBe('uk-four-day-week');
      expect(data.metadata.source).toBe('sample');
      expect(data.metadata.openGraph.title).toBe('Should the UK adopt a four-day work week?');
      expect(data.metadata.clarityScore).toBe(85);
    });

    it('should return metadata for alternate sample brief ID format', async () => {
      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/brief-001-uk-4day-week');
      const response = await GET(request, { params: { id: 'brief-001-uk-4day-week' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.source).toBe('sample');
      expect(data.metadata.openGraph.title).toContain('four-day work week');
    });

    it('should fetch metadata from database for UUID-based brief', async () => {
      const mockBrief = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        question: 'What is the future of renewable energy?',
        clarity_score: 92,
        summaries: {
          undergrad: 'Renewable energy is transforming the global economy.',
          teen: 'Clean energy is becoming more popular.',
        },
      };

      mockGetBriefById.mockResolvedValue({
        data: mockBrief,
        error: null,
      });

      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      const response = await GET(request, { params: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.source).toBe('database');
      expect(data.metadata.openGraph.title).toBe('What is the future of renewable energy?');
      expect(data.metadata.clarityScore).toBe(92);
    });

    it('should return 404 when brief not found in database', async () => {
      mockGetBriefById.mockResolvedValue({
        data: null,
        error: null,
      });

      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/nonexistent-id');
      const response = await GET(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
      expect(data.metadata.usingFallback).toBe(true);
    });

    it('should handle database errors gracefully with fallback', async () => {
      mockGetBriefById.mockRejectedValue(new Error('Database connection failed'));

      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/some-uuid');
      const response = await GET(request, { params: { id: 'some-uuid' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Database connection failed');
      expect(data.metadata.usingFallback).toBe(true);
      expect(data.warnings).toContain('Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly');
    });

    it('should include OpenGraph metadata structure', async () => {
      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/what-is-a-state');
      const response = await GET(request, { params: { id: 'what-is-a-state' } });
      const data = await response.json();

      expect(data.metadata.openGraph).toBeDefined();
      expect(data.metadata.openGraph.title).toBeDefined();
      expect(data.metadata.openGraph.description).toBeDefined();
      expect(data.metadata.openGraph.url).toContain('/brief/what-is-a-state');
      expect(data.metadata.openGraph.siteName).toBe('State of Clarity');
      expect(data.metadata.openGraph.image.width).toBe(1200);
      expect(data.metadata.openGraph.image.height).toBe(630);
    });

    it('should include Twitter card metadata', async () => {
      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/uk-four-day-week');
      const response = await GET(request, { params: { id: 'uk-four-day-week' } });
      const data = await response.json();

      expect(data.metadata.twitter).toBeDefined();
      expect(data.metadata.twitter.card).toBe('summary_large_image');
      expect(data.metadata.twitter.title).toBeDefined();
      expect(data.metadata.twitter.creator).toBe('@stateofclarity');
    });

    it('should include canonical URL', async () => {
      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/medicare-for-all');
      const response = await GET(request, { params: { id: 'medicare-for-all' } });
      const data = await response.json();

      expect(data.metadata.canonical).toBe('https://stateofclarity.org/brief/medicare-for-all');
    });

    it('should include OG image check information', async () => {
      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/uk-four-day-week');
      const response = await GET(request, { params: { id: 'uk-four-day-week' } });
      const data = await response.json();

      expect(data.ogImageCheck).toBeDefined();
      expect(data.ogImageCheck.url).toContain('/api/og?');
    });

    it('should handle brief with array-format summaries from database', async () => {
      const mockBrief = {
        id: 'test-uuid',
        question: 'Test question with array summaries?',
        clarity_score: 80,
        summaries: [
          { level: 'undergrad', content: 'Undergrad level summary content.' },
          { level: 'teen', content: 'Teen level summary content.' },
        ],
      };

      mockGetBriefById.mockResolvedValue({
        data: mockBrief,
        error: null,
      });

      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/test-uuid');
      const response = await GET(request, { params: { id: 'test-uuid' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.openGraph.description).toContain('Undergrad level summary');
    });

    it('should truncate long descriptions to 200 characters', async () => {
      const longSummary = 'A'.repeat(300);
      const mockBrief = {
        id: 'test-uuid',
        question: 'Test question?',
        clarity_score: 75,
        summaries: {
          undergrad: longSummary,
        },
      };

      mockGetBriefById.mockResolvedValue({
        data: mockBrief,
        error: null,
      });

      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/test-uuid');
      const response = await GET(request, { params: { id: 'test-uuid' } });
      const data = await response.json();

      expect(data.metadata.html.description.length).toBeLessThanOrEqual(203); // 200 + "..."
      expect(data.metadata.html.description).toContain('...');
    });

    it('should add warning when brief has no summaries', async () => {
      const mockBrief = {
        id: 'test-uuid',
        question: 'Test question without summaries?',
        clarity_score: 65,
        summaries: null,
      };

      mockGetBriefById.mockResolvedValue({
        data: mockBrief,
        error: null,
      });

      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/test-uuid');
      const response = await GET(request, { params: { id: 'test-uuid' } });
      const data = await response.json();

      expect(data.warnings).toContain('Brief has no summaries');
    });

    it('should include timestamp in response', async () => {
      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/uk-four-day-week');
      const response = await GET(request, { params: { id: 'uk-four-day-week' } });
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('should set no-cache headers', async () => {
      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/uk-four-day-week');
      const response = await GET(request, { params: { id: 'uk-four-day-week' } });

      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    });

    it('should warn when NEXT_PUBLIC_BASE_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;

      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/uk-four-day-week');
      const response = await GET(request, { params: { id: 'uk-four-day-week' } });
      const data = await response.json();

      expect(data.warnings.some((w: string) => w.includes('NEXT_PUBLIC_BASE_URL'))).toBe(true);
    });

    it('should use teen summary as fallback when undergrad not available', async () => {
      const { GET } = await import('@/app/api/brief-metadata/[id]/route');
      const request = new NextRequest('http://localhost/api/brief-metadata/medicare-for-all');
      const response = await GET(request, { params: { id: 'medicare-for-all' } });
      const data = await response.json();

      expect(data.metadata.openGraph.description).toContain('Medicare for All');
    });
  });
});
