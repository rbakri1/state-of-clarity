/**
 * Research Agent Unit Tests
 *
 * Tests for the Tavily-based research agent that discovers and analyzes sources.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearTavilyMocks, queueTavilyResponse, createMockResults } from '../../mocks/tavily';
import { resetAnthropicMocks, queueMockResponse } from '../../mocks/anthropic';

// Mock fetch for Tavily API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Anthropic before importing the research agent
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

// Mock safeAICall to avoid wrapping issues
vi.mock('@/lib/ai/safe-ai-call', () => ({
  safeAICall: async (fn: () => Promise<any>) => {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
}));

import { researchAgent, Source } from '@/lib/agents/research-agent';

describe('Research Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTavilyMocks();
    resetAnthropicMocks();
  });

  describe('Source Discovery', () => {
    it('should discover sources for a given question', async () => {
      // Mock Tavily API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'What is the impact of inflation on UK wages?',
          results: [
            {
              url: 'https://bbc.co.uk/news/economy-inflation',
              title: 'BBC Analysis: UK Inflation Impact',
              content: 'Analysis of how inflation affects wages across the UK economy.',
              score: 0.95,
              published_date: '2025-01-10',
            },
            {
              url: 'https://ft.com/markets/wages',
              title: 'Financial Times: Wage Growth Report',
              content: 'Latest data on wage growth in the UK.',
              score: 0.90,
              published_date: '2025-01-08',
            },
          ],
        }),
      });

      // Mock political lean classification
      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
        { index: 2, political_lean: 'center-right' },
      ]));

      const sources = await researchAgent('What is the impact of inflation on UK wages?');

      expect(sources).toBeInstanceOf(Array);
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should return structured Source objects', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test question',
          results: [
            {
              url: 'https://example.com/article',
              title: 'Test Article',
              content: 'Test content for the article.',
              score: 0.85,
              published_date: '2025-01-05',
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
      ]));

      const sources = await researchAgent('Test question');

      expect(sources[0]).toHaveProperty('id');
      expect(sources[0]).toHaveProperty('url');
      expect(sources[0]).toHaveProperty('title');
      expect(sources[0]).toHaveProperty('content');
      expect(sources[0]).toHaveProperty('publisher');
      expect(sources[0]).toHaveProperty('political_lean');
      expect(sources[0]).toHaveProperty('credibility_score');
      expect(sources[0]).toHaveProperty('relevance_score');
      expect(sources[0]).toHaveProperty('source_type');
    });

    it('should limit content to 1000 characters per source', async () => {
      const longContent = 'x'.repeat(2000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://example.com/long-article',
              title: 'Long Article',
              content: longContent,
              score: 0.9,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].content.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Credibility Scoring', () => {
    it('should assign high credibility to government sources', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://gov.uk/policy-document',
              title: 'UK Government Policy',
              content: 'Official government policy document.',
              score: 0.9,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].credibility_score).toBeGreaterThanOrEqual(9);
    });

    it('should assign high credibility to BBC', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://bbc.co.uk/news/article',
              title: 'BBC News Article',
              content: 'BBC coverage of the event.',
              score: 0.9,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].credibility_score).toBeGreaterThanOrEqual(8.5);
    });

    it('should assign lower credibility to unknown sources', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://unknownblog.com/post',
              title: 'Blog Post',
              content: 'Random blog content.',
              score: 0.7,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'unknown' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].credibility_score).toBeLessThan(8);
    });

    it('should give recency bonus to recent publications', async () => {
      const recentDate = new Date().toISOString().split('T')[0];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://reuters.com/recent-article',
              title: 'Recent Reuters Article',
              content: 'Recent news coverage.',
              score: 0.9,
              published_date: recentDate,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
      ]));

      const sources = await researchAgent('Test');

      // Reuters base is 9, should get +0.5 recency bonus
      expect(sources[0].credibility_score).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Source Type Classification', () => {
    it('should classify government sources as primary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://ons.gov.uk/statistics',
              title: 'ONS Statistics',
              content: 'Official statistics data.',
              score: 0.95,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].source_type).toBe('primary');
    });

    it('should classify academic sources as primary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://oxford.ac.uk/research',
              title: 'Oxford Research Paper',
              content: 'Academic research findings.',
              score: 0.9,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].source_type).toBe('primary');
    });

    it('should classify news sources as secondary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://theguardian.com/article',
              title: 'Guardian Article',
              content: 'News coverage.',
              score: 0.85,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center-left' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].source_type).toBe('secondary');
    });

    it('should classify Wikipedia as tertiary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://en.wikipedia.org/wiki/Topic',
              title: 'Wikipedia: Topic',
              content: 'Encyclopedia entry.',
              score: 0.8,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].source_type).toBe('tertiary');
    });
  });

  describe('Political Lean Classification', () => {
    it('should classify sources using Claude API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://theguardian.com/opinion',
              title: 'Guardian Opinion',
              content: 'Opinion piece.',
              score: 0.85,
            },
            {
              url: 'https://telegraph.co.uk/news',
              title: 'Telegraph News',
              content: 'News article.',
              score: 0.82,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center-left', reasoning: 'Guardian is center-left' },
        { index: 2, political_lean: 'right', reasoning: 'Telegraph is right-leaning' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].political_lean).toBe('center-left');
      expect(sources[1].political_lean).toBe('right');
    });

    it('should default to unknown when classification fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://example.com/article',
              title: 'Example Article',
              content: 'Content.',
              score: 0.8,
            },
          ],
        }),
      });

      // Queue a response that will fail to parse
      queueMockResponse('Invalid response');

      const sources = await researchAgent('Test');

      expect(sources[0].political_lean).toBe('unknown');
    });
  });

  describe('Result Limiting', () => {
    it('should return maximum 20 sources', async () => {
      // Create 25 mock results
      const manyResults = Array.from({ length: 25 }, (_, i) => ({
        url: `https://example${i}.com/article`,
        title: `Article ${i}`,
        content: `Content ${i}`,
        score: 0.9 - (i * 0.01),
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: manyResults,
        }),
      });

      // Queue classifications for all sources
      const classifications = manyResults.map((_, i) => ({
        index: i + 1,
        political_lean: 'center',
      }));
      queueMockResponse(JSON.stringify(classifications));

      const sources = await researchAgent('Test');

      expect(sources.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when Tavily API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(researchAgent('Test')).rejects.toThrow();
    });

    it('should throw error when AI service is unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(researchAgent('Test')).rejects.toThrow();
    });
  });

  describe('Publisher Extraction', () => {
    it('should extract publisher from domain', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          query: 'Test',
          results: [
            {
              url: 'https://www.economist.com/article',
              title: 'Economist Article',
              content: 'Content.',
              score: 0.9,
            },
          ],
        }),
      });

      queueMockResponse(JSON.stringify([
        { index: 1, political_lean: 'center' },
      ]));

      const sources = await researchAgent('Test');

      expect(sources[0].publisher).toBe('Economist');
    });
  });
});
