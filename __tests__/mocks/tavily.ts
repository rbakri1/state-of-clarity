/**
 * Tavily Research API Mock
 *
 * Provides mock responses for Tavily research API calls.
 */

import { vi } from 'vitest';

// Mock search result
export interface MockTavilyResult {
  url: string;
  title: string;
  content: string;
  score: number;
  published_date?: string;
  raw_content?: string;
}

// Mock search response
export interface MockTavilySearchResponse {
  query: string;
  results: MockTavilyResult[];
  answer?: string;
  response_time: number;
}

// Default mock results by topic
const defaultResults: Record<string, MockTavilyResult[]> = {
  default: [
    {
      url: 'https://example.com/article-1',
      title: 'Research Article 1',
      content: 'This is a comprehensive research article about the topic.',
      score: 0.95,
      published_date: '2025-01-01',
    },
    {
      url: 'https://reuters.com/article-2',
      title: 'Reuters News Article',
      content: 'Reuters reporting on the latest developments.',
      score: 0.90,
      published_date: '2025-01-05',
    },
    {
      url: 'https://academic.edu/paper-1',
      title: 'Academic Research Paper',
      content: 'Peer-reviewed research findings on the subject.',
      score: 0.88,
      published_date: '2024-12-15',
    },
    {
      url: 'https://bbc.com/news-article',
      title: 'BBC News Coverage',
      content: 'BBC analysis of current events.',
      score: 0.85,
      published_date: '2025-01-08',
    },
    {
      url: 'https://think-tank.org/report',
      title: 'Think Tank Report',
      content: 'Policy analysis and recommendations.',
      score: 0.82,
      published_date: '2024-11-20',
    },
  ],
  economics: [
    {
      url: 'https://economist.com/analysis',
      title: 'The Economist Analysis',
      content: 'Economic analysis and market trends.',
      score: 0.95,
      published_date: '2025-01-10',
    },
    {
      url: 'https://ft.com/markets',
      title: 'Financial Times Markets',
      content: 'Financial market analysis.',
      score: 0.92,
      published_date: '2025-01-09',
    },
  ],
  healthcare: [
    {
      url: 'https://nejm.org/research',
      title: 'NEJM Research',
      content: 'Medical research findings.',
      score: 0.96,
      published_date: '2025-01-05',
    },
    {
      url: 'https://who.int/report',
      title: 'WHO Health Report',
      content: 'World Health Organization guidelines.',
      score: 0.93,
      published_date: '2025-01-01',
    },
  ],
  climate: [
    {
      url: 'https://nature.com/climate',
      title: 'Nature Climate Change',
      content: 'Climate science research.',
      score: 0.95,
      published_date: '2025-01-08',
    },
    {
      url: 'https://ipcc.ch/report',
      title: 'IPCC Report',
      content: 'Intergovernmental Panel on Climate Change findings.',
      score: 0.94,
      published_date: '2024-12-01',
    },
  ],
};

// Response queue for custom responses
let responseQueue: MockTavilySearchResponse[] = [];

// Mock search function
export const mockTavilySearch = vi.fn().mockImplementation(async (params: {
  query: string;
  search_depth?: 'basic' | 'advanced';
  include_answer?: boolean;
  include_raw_content?: boolean;
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
}): Promise<MockTavilySearchResponse> => {
  // Check for queued response
  if (responseQueue.length > 0) {
    const response = responseQueue.shift()!;
    return response;
  }

  const query = params.query.toLowerCase();
  let results: MockTavilyResult[];

  // Match by topic
  if (query.includes('econom') || query.includes('gdp') || query.includes('market')) {
    results = [...defaultResults.economics, ...defaultResults.default.slice(0, 3)];
  } else if (query.includes('health') || query.includes('medic') || query.includes('disease')) {
    results = [...defaultResults.healthcare, ...defaultResults.default.slice(0, 3)];
  } else if (query.includes('climate') || query.includes('environment') || query.includes('carbon')) {
    results = [...defaultResults.climate, ...defaultResults.default.slice(0, 3)];
  } else {
    results = [...defaultResults.default];
  }

  // Apply domain filters
  if (params.include_domains?.length) {
    results = results.filter(r =>
      params.include_domains!.some(domain => r.url.includes(domain))
    );
  }
  if (params.exclude_domains?.length) {
    results = results.filter(r =>
      !params.exclude_domains!.some(domain => r.url.includes(domain))
    );
  }

  // Limit results
  const maxResults = params.max_results ?? 10;
  results = results.slice(0, maxResults);

  // Add raw content if requested
  if (params.include_raw_content) {
    results = results.map(r => ({
      ...r,
      raw_content: `Full article content for: ${r.title}\n\n${r.content}\n\nMore detailed information would go here...`,
    }));
  }

  return {
    query: params.query,
    results,
    answer: params.include_answer ? `Summary answer for: ${params.query}` : undefined,
    response_time: 1.5,
  };
});

// Mock Tavily client class
export class MockTavilyClient {
  search = mockTavilySearch;

  constructor(_options?: { apiKey?: string }) {
    // Accept options but ignore them in mock
  }
}

// Helper to queue custom response
export function queueTavilyResponse(response: MockTavilySearchResponse) {
  responseQueue.push(response);
}

// Helper to queue empty results
export function queueEmptyResults(query: string) {
  responseQueue.push({
    query,
    results: [],
    response_time: 0.5,
  });
}

// Helper to queue error (will throw)
export function mockTavilyError(message: string) {
  mockTavilySearch.mockRejectedValueOnce(new Error(message));
}

// Helper to create custom results
export function createMockResults(count: number, options?: {
  urlBase?: string;
  titleBase?: string;
  scoreRange?: [number, number];
}): MockTavilyResult[] {
  const results: MockTavilyResult[] = [];
  for (let i = 0; i < count; i++) {
    const scoreMin = options?.scoreRange?.[0] ?? 0.7;
    const scoreMax = options?.scoreRange?.[1] ?? 0.98;
    results.push({
      url: `${options?.urlBase ?? 'https://example.com'}/article-${i + 1}`,
      title: `${options?.titleBase ?? 'Article'} ${i + 1}`,
      content: `Content for article ${i + 1}`,
      score: scoreMin + Math.random() * (scoreMax - scoreMin),
      published_date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    });
  }
  return results;
}

// Helper to clear queued responses
export function clearTavilyMocks() {
  responseQueue = [];
  mockTavilySearch.mockClear();
}

// Export default for vi.mock
export default MockTavilyClient;
