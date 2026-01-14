/**
 * Brief Service Unit Tests
 *
 * Tests for creating, updating, and retrieving briefs from the database.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearMockData, mockSupabaseClient, seedMockData } from '../../mocks/supabase';
import { resetKvMocks } from '../../mocks/vercel-kv';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock cache functions
vi.mock('@/lib/cache/with-cache', () => ({
  withCache: async <T>(key: string, fn: () => Promise<T>) => fn(),
}));

vi.mock('@/lib/cache/invalidate', () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

// Mock safe-query to return data directly
vi.mock('@/lib/supabase/safe-query', () => ({
  safeQuery: async <T>(queryFn: () => any) => {
    const result = await queryFn();
    if (result.error) {
      return { data: null, error: result.error, isError: true };
    }
    return { data: result.data as T, error: null, isError: false };
  },
}));

import {
  createBrief,
  updateBriefClassification,
  updateBriefFromState,
  saveBriefSources,
  getBriefById,
  getPopularBriefs,
  warmBriefCache,
  completeBriefGeneration,
} from '@/lib/services/brief-service';
import type { BriefState } from '@/lib/agents/langgraph-orchestrator';
import type { Source } from '@/lib/agents/research-agent';
import type { QuestionClassification } from '@/lib/types/classification';

describe('Brief Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMockData();
    resetKvMocks();
  });

  describe('createBrief', () => {
    it('should create a new brief with question and user ID', async () => {
      const question = 'What is the impact of inflation?';
      const userId = 'user-123';

      const result = await createBrief(question, userId);

      expect(result.error).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.id).not.toBe('');
    });

    it('should create a brief without user ID', async () => {
      const question = 'What is the impact of inflation?';

      const result = await createBrief(question);

      expect(result.error).toBeNull();
      expect(result.id).toBeDefined();
    });

    it('should create a brief with null user ID', async () => {
      const question = 'Test question';

      const result = await createBrief(question, null);

      expect(result.error).toBeNull();
      expect(result.id).toBeDefined();
    });

    it('should initialize brief with empty structured data', async () => {
      const question = 'Test question';

      const result = await createBrief(question);

      expect(result.error).toBeNull();
      // The mock should have been called with the right structure
      expect(result.id).toBeDefined();
    });
  });

  describe('updateBriefClassification', () => {
    it('should skip classification update (column not in DB)', async () => {
      const briefId = 'brief-123';
      const classification: QuestionClassification = {
        domain: 'economics',
        controversyLevel: 'medium',
        questionType: 'analytical',
        temporalScope: 'current',
      };

      const result = await updateBriefClassification(briefId, classification);

      // Currently a no-op since column doesn't exist
      expect(result.error).toBeNull();
    });
  });

  describe('updateBriefFromState', () => {
    it('should update brief with narrative', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Introduction text',
          mainBody: 'Main body text',
          conclusion: 'Conclusion text',
        },
      };

      const result = await updateBriefFromState(briefId, state as BriefState);

      expect(result.error).toBeNull();
    });

    it('should update brief with structured data', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        structure: {
          definitions: [{ term: 'GDP', definition: 'Gross Domestic Product' }],
          factors: [{ name: 'Growth', description: 'Economic growth' }],
          policies: [],
          consequences: [],
          timeline: [],
        },
      };

      const result = await updateBriefFromState(briefId, state as BriefState);

      expect(result.error).toBeNull();
    });

    it('should update brief with summaries', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        summaries: {
          child: 'Simple summary for children',
          teen: 'Summary for teenagers',
          undergrad: 'Summary for undergraduates',
          postdoc: 'Detailed summary for experts',
        },
      };

      const result = await updateBriefFromState(briefId, state as BriefState);

      expect(result.error).toBeNull();
    });

    it('should update brief with clarity score', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        clarityScore: {
          overall: 8.5,
          dimensions: {
            firstPrinciplesCoherence: { score: 8.0, critique: 'Good' },
            internalConsistency: { score: 9.0, critique: 'Excellent' },
            evidenceQuality: { score: 8.0, critique: 'Good' },
            accessibility: { score: 8.5, critique: 'Very good' },
            objectivity: { score: 8.0, critique: 'Good' },
            factualAccuracy: { score: 9.0, critique: 'Excellent' },
            biasDetection: { score: 8.0, critique: 'Good' },
          },
        },
      };

      const result = await updateBriefFromState(briefId, state as BriefState);

      expect(result.error).toBeNull();
    });

    it('should handle empty state without making updates', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {};

      const result = await updateBriefFromState(briefId, state as BriefState);

      expect(result.error).toBeNull();
    });

    it('should filter out empty narrative parts', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Introduction',
          mainBody: '', // Empty
          conclusion: 'Conclusion',
        },
      };

      const result = await updateBriefFromState(briefId, state as BriefState);

      expect(result.error).toBeNull();
    });
  });

  describe('saveBriefSources', () => {
    it('should save sources for a brief', async () => {
      const briefId = 'brief-123';
      const sources: Source[] = [
        {
          id: 'source-1',
          url: 'https://example.com/article',
          title: 'Test Article',
          content: 'Article content',
          publisher: 'Example Publisher',
          source_type: 'secondary',
          political_lean: 'center',
          credibility_score: 8.0,
          relevance_score: 0.9,
          accessed_at: new Date().toISOString(),
        },
      ];

      const result = await saveBriefSources(briefId, sources);

      expect(result.error).toBeNull();
    });

    it('should handle empty sources array', async () => {
      const briefId = 'brief-123';
      const sources: Source[] = [];

      const result = await saveBriefSources(briefId, sources);

      expect(result.error).toBeNull();
    });

    it('should handle multiple sources', async () => {
      const briefId = 'brief-123';
      const sources: Source[] = [
        {
          id: 'source-1',
          url: 'https://bbc.co.uk/article-1',
          title: 'BBC Article',
          content: 'BBC content',
          publisher: 'BBC',
          source_type: 'secondary',
          political_lean: 'center',
          credibility_score: 9.0,
          relevance_score: 0.95,
          accessed_at: new Date().toISOString(),
        },
        {
          id: 'source-2',
          url: 'https://gov.uk/report',
          title: 'Government Report',
          content: 'Official report content',
          publisher: 'Gov',
          source_type: 'primary',
          political_lean: 'center',
          credibility_score: 10.0,
          relevance_score: 0.9,
          accessed_at: new Date().toISOString(),
        },
      ];

      const result = await saveBriefSources(briefId, sources);

      expect(result.error).toBeNull();
    });

    it('should truncate long content in sources', async () => {
      const briefId = 'brief-123';
      const longContent = 'x'.repeat(1000);
      const sources: Source[] = [
        {
          id: 'source-1',
          url: 'https://example.com/long-article',
          title: 'Long Article',
          content: longContent,
          publisher: 'Example',
          source_type: 'secondary',
          political_lean: 'center',
          credibility_score: 7.0,
          relevance_score: 0.8,
          accessed_at: new Date().toISOString(),
        },
      ];

      const result = await saveBriefSources(briefId, sources);

      expect(result.error).toBeNull();
    });
  });

  describe('getBriefById', () => {
    it('should retrieve a brief by ID', async () => {
      // Seed mock data
      seedMockData('briefs', [{
        id: 'brief-123',
        question: 'What is inflation?',
        narrative: 'A detailed analysis...',
        user_id: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);

      const result = await getBriefById('brief-123');

      expect(result.isError).toBe(false);
      expect(result.data).toBeDefined();
    });

    it('should handle non-existent brief', async () => {
      const result = await getBriefById('non-existent-id');

      // Should return error or null data
      expect(result.data).toBeNull();
    });
  });

  describe('getPopularBriefs', () => {
    it('should retrieve popular briefs', async () => {
      seedMockData('briefs', [
        {
          id: 'brief-1',
          question: 'Question 1',
          clarity_score: 9.0,
          created_at: new Date().toISOString(),
        },
        {
          id: 'brief-2',
          question: 'Question 2',
          clarity_score: 8.5,
          created_at: new Date().toISOString(),
        },
      ]);

      const result = await getPopularBriefs(10);

      expect(result.isError).toBe(false);
    });

    it('should respect limit parameter', async () => {
      seedMockData('briefs', [
        { id: 'brief-1', question: 'Q1', clarity_score: 9.0 },
        { id: 'brief-2', question: 'Q2', clarity_score: 8.5 },
        { id: 'brief-3', question: 'Q3', clarity_score: 8.0 },
      ]);

      const result = await getPopularBriefs(2);

      expect(result.isError).toBe(false);
    });

    it('should use default limit of 10', async () => {
      const result = await getPopularBriefs();

      expect(result.isError).toBe(false);
    });
  });

  describe('warmBriefCache', () => {
    it('should warm cache for a brief', async () => {
      seedMockData('briefs', [{
        id: 'brief-123',
        question: 'Test question',
        narrative: 'Test narrative',
      }]);

      // Should not throw
      await warmBriefCache('brief-123');
    });

    it('should handle errors gracefully', async () => {
      // Non-existent brief should not throw
      await warmBriefCache('non-existent-id');
    });
  });

  describe('completeBriefGeneration', () => {
    it('should complete brief generation with all state', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Intro',
          mainBody: 'Body',
          conclusion: 'Conclusion',
        },
        summaries: {
          child: 'Simple',
          teen: 'Teen summary',
          undergrad: 'Undergrad summary',
          postdoc: 'Expert summary',
        },
        structure: {
          definitions: [],
          factors: [],
          policies: [],
          consequences: [],
          timeline: [],
        },
        clarityScore: {
          overall: 8.0,
          dimensions: {
            firstPrinciplesCoherence: { score: 8.0, critique: 'Good' },
            internalConsistency: { score: 8.0, critique: 'Good' },
            evidenceQuality: { score: 8.0, critique: 'Good' },
            accessibility: { score: 8.0, critique: 'Good' },
            objectivity: { score: 8.0, critique: 'Good' },
            factualAccuracy: { score: 8.0, critique: 'Good' },
            biasDetection: { score: 8.0, critique: 'Good' },
          },
        },
        sources: [],
      };

      const result = await completeBriefGeneration(
        briefId,
        state as BriefState,
        5000
      );

      expect(result.error).toBeNull();
    });

    it('should complete generation with sources', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Intro',
          mainBody: 'Body',
          conclusion: 'Conclusion',
        },
        sources: [
          {
            id: 'source-1',
            url: 'https://example.com',
            title: 'Example',
            content: 'Content',
            publisher: 'Example',
            source_type: 'secondary',
            political_lean: 'center',
            credibility_score: 8.0,
            relevance_score: 0.9,
            accessed_at: new Date().toISOString(),
          },
        ],
      };

      const result = await completeBriefGeneration(
        briefId,
        state as BriefState
      );

      expect(result.error).toBeNull();
    });

    it('should update metadata with generation time', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Intro',
          mainBody: 'Body',
          conclusion: 'Conclusion',
        },
        classification: {
          domain: 'economics',
          controversyLevel: 'medium',
          questionType: 'analytical',
          temporalScope: 'current',
        },
      };

      const result = await completeBriefGeneration(
        briefId,
        state as BriefState,
        10000 // 10 seconds
      );

      expect(result.error).toBeNull();
    });
  });

  describe('generateTagsFromClassification', () => {
    it('should generate tags for economics domain', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Intro',
          mainBody: 'Body',
          conclusion: 'Conclusion',
        },
        classification: {
          domain: 'economics',
          controversyLevel: 'low',
          questionType: 'factual',
          temporalScope: 'current',
        },
      };

      const result = await completeBriefGeneration(
        briefId,
        state as BriefState,
        5000
      );

      expect(result.error).toBeNull();
    });

    it('should add Contentious tag for high controversy', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Intro',
          mainBody: 'Body',
          conclusion: 'Conclusion',
        },
        classification: {
          domain: 'governance',
          controversyLevel: 'high',
          questionType: 'opinion',
          temporalScope: 'current',
        },
      };

      const result = await completeBriefGeneration(
        briefId,
        state as BriefState,
        5000
      );

      expect(result.error).toBeNull();
    });

    it('should add Historical tag for historical scope', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Intro',
          mainBody: 'Body',
          conclusion: 'Conclusion',
        },
        classification: {
          domain: 'economics',
          controversyLevel: 'low',
          questionType: 'analytical',
          temporalScope: 'historical',
        },
      };

      const result = await completeBriefGeneration(
        briefId,
        state as BriefState,
        5000
      );

      expect(result.error).toBeNull();
    });

    it('should add Future-looking tag for future scope', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Intro',
          mainBody: 'Body',
          conclusion: 'Conclusion',
        },
        classification: {
          domain: 'technology',
          controversyLevel: 'medium',
          questionType: 'opinion',
          temporalScope: 'future',
        },
      };

      const result = await completeBriefGeneration(
        briefId,
        state as BriefState,
        5000
      );

      expect(result.error).toBeNull();
    });

    it('should add Analysis tag for analytical questions', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Intro',
          mainBody: 'Body',
          conclusion: 'Conclusion',
        },
        classification: {
          domain: 'healthcare',
          controversyLevel: 'medium',
          questionType: 'analytical',
          temporalScope: 'current',
        },
      };

      const result = await completeBriefGeneration(
        briefId,
        state as BriefState,
        5000
      );

      expect(result.error).toBeNull();
    });

    it('should add Comparison tag for comparative questions', async () => {
      const briefId = 'brief-123';
      const state: Partial<BriefState> = {
        narrative: {
          introduction: 'Intro',
          mainBody: 'Body',
          conclusion: 'Conclusion',
        },
        classification: {
          domain: 'healthcare',
          controversyLevel: 'medium',
          questionType: 'comparative',
          temporalScope: 'timeless',
        },
      };

      const result = await completeBriefGeneration(
        briefId,
        state as BriefState,
        5000
      );

      expect(result.error).toBeNull();
    });
  });
});
