/**
 * useReadingHistory Hook Unit Tests
 *
 * Tests for the reading history functionality hook.
 * Tests the exported type interface and hook structure.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useReadingHistory, ReadingHistoryEntry } from '@/lib/reading-history/useReadingHistory';

// Mock the Supabase browser client module - uses a fresh mock per test via factory
vi.mock('@/lib/supabase/browser', () => {
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
  const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return {
    createBrowserClient: () => ({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    }),
    // Expose for test setup
    __mocks: { mockGetUser, mockFrom, mockSelect, mockEq, mockOrder },
  };
});

describe('useReadingHistory', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Type Exports', () => {
    it('should export ReadingHistoryEntry type with correct structure', () => {
      // Type assertion test - compile time check
      const entry: ReadingHistoryEntry = {
        brief_id: 'test-id',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: {
          question: 'Test question?',
          clarity_score: 80,
          metadata: { tags: ['test'] },
        },
      };

      expect(entry.brief_id).toBe('test-id');
      expect(entry.read_at).toBe('2025-01-01T00:00:00Z');
      expect(entry.time_spent_seconds).toBe(60);
      expect(entry.reading_level_viewed).toBe('standard');
      expect(entry.brief?.question).toBe('Test question?');
      expect(entry.brief?.clarity_score).toBe(80);
      expect(entry.brief?.metadata?.tags).toEqual(['test']);
    });

    it('should allow null values for optional fields in ReadingHistoryEntry', () => {
      const minimalEntry: ReadingHistoryEntry = {
        brief_id: 'minimal-id',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: null,
        reading_level_viewed: null,
        brief: null,
      };

      expect(minimalEntry.brief_id).toBe('minimal-id');
      expect(minimalEntry.time_spent_seconds).toBeNull();
      expect(minimalEntry.reading_level_viewed).toBeNull();
      expect(minimalEntry.brief).toBeNull();
    });

    it('should allow null metadata in brief', () => {
      const entryWithNullMeta: ReadingHistoryEntry = {
        brief_id: 'null-meta-id',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 30,
        reading_level_viewed: 'detailed',
        brief: {
          question: 'Question with null meta?',
          clarity_score: 75,
          metadata: null,
        },
      };

      expect(entryWithNullMeta.brief?.metadata).toBeNull();
    });
  });

  describe('Hook Initial State', () => {
    it('should return isLoading as true initially', () => {
      const { result } = renderHook(() => useReadingHistory());

      expect(result.current.isLoading).toBe(true);
    });

    it('should return empty history array initially', () => {
      const { result } = renderHook(() => useReadingHistory());

      expect(result.current.history).toEqual([]);
    });

    it('should return null error initially', () => {
      const { result } = renderHook(() => useReadingHistory());

      expect(result.current.error).toBeNull();
    });

    it('should provide a refetch function', () => {
      const { result } = renderHook(() => useReadingHistory());

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Hook Return Type', () => {
    it('should return an object with history, isLoading, error, and refetch', () => {
      const { result } = renderHook(() => useReadingHistory());

      expect(result.current).toHaveProperty('history');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should have history as an array', () => {
      const { result } = renderHook(() => useReadingHistory());

      expect(Array.isArray(result.current.history)).toBe(true);
    });

    it('should have isLoading as a boolean', () => {
      const { result } = renderHook(() => useReadingHistory());

      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should have error as null or Error', () => {
      const { result } = renderHook(() => useReadingHistory());

      expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
    });

    it('should have refetch as a function', () => {
      const { result } = renderHook(() => useReadingHistory());

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('ReadingHistoryEntry Type Validation', () => {
    it('should accept all reading level types', () => {
      const standardEntry: ReadingHistoryEntry = {
        brief_id: 'standard',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: null,
      };

      const detailedEntry: ReadingHistoryEntry = {
        brief_id: 'detailed',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'detailed',
        brief: null,
      };

      const expertEntry: ReadingHistoryEntry = {
        brief_id: 'expert',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'expert',
        brief: null,
      };

      expect(standardEntry.reading_level_viewed).toBe('standard');
      expect(detailedEntry.reading_level_viewed).toBe('detailed');
      expect(expertEntry.reading_level_viewed).toBe('expert');
    });

    it('should handle entries with all brief fields populated', () => {
      const fullEntry: ReadingHistoryEntry = {
        brief_id: 'full-entry',
        read_at: '2025-01-15T09:00:00Z',
        time_spent_seconds: 300,
        reading_level_viewed: 'expert',
        brief: {
          question: 'What is the impact of climate change on agriculture?',
          clarity_score: 92,
          metadata: {
            tags: ['climate', 'agriculture', 'policy', 'science'],
          },
        },
      };

      expect(fullEntry.brief).not.toBeNull();
      expect(fullEntry.brief?.question).toContain('climate change');
      expect(fullEntry.brief?.clarity_score).toBe(92);
      expect(fullEntry.brief?.metadata?.tags).toHaveLength(4);
    });

    it('should handle time_spent_seconds as zero', () => {
      const instantRead: ReadingHistoryEntry = {
        brief_id: 'instant',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 0,
        reading_level_viewed: 'standard',
        brief: null,
      };

      expect(instantRead.time_spent_seconds).toBe(0);
    });

    it('should handle large time_spent_seconds values', () => {
      const longRead: ReadingHistoryEntry = {
        brief_id: 'long-read',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 3600 * 24, // 24 hours in seconds
        reading_level_viewed: 'standard',
        brief: null,
      };

      expect(longRead.time_spent_seconds).toBe(86400);
    });

    it('should handle empty tags array in metadata', () => {
      const noTagsEntry: ReadingHistoryEntry = {
        brief_id: 'no-tags',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: {
          question: 'Question without tags?',
          clarity_score: 70,
          metadata: { tags: [] },
        },
      };

      expect(noTagsEntry.brief?.metadata?.tags).toEqual([]);
    });

    it('should handle various clarity_score values', () => {
      const lowScore: ReadingHistoryEntry = {
        brief_id: 'low-score',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: {
          question: 'Low quality?',
          clarity_score: 10,
          metadata: null,
        },
      };

      const highScore: ReadingHistoryEntry = {
        brief_id: 'high-score',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: {
          question: 'High quality?',
          clarity_score: 100,
          metadata: null,
        },
      };

      const nullScore: ReadingHistoryEntry = {
        brief_id: 'null-score',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: {
          question: 'Null score?',
          clarity_score: null,
          metadata: null,
        },
      };

      expect(lowScore.brief?.clarity_score).toBe(10);
      expect(highScore.brief?.clarity_score).toBe(100);
      expect(nullScore.brief?.clarity_score).toBeNull();
    });

    it('should handle ISO date strings for read_at', () => {
      const entry: ReadingHistoryEntry = {
        brief_id: 'dated',
        read_at: '2025-06-15T14:30:00.000Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: null,
      };

      const date = new Date(entry.read_at);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(5); // June (0-indexed)
      expect(date.getDate()).toBe(15);
    });
  });

  describe('Multiple Entries Data Structure', () => {
    it('should support array of ReadingHistoryEntry', () => {
      const entries: ReadingHistoryEntry[] = [
        {
          brief_id: 'entry-1',
          read_at: '2025-01-01T10:00:00Z',
          time_spent_seconds: 120,
          reading_level_viewed: 'standard',
          brief: { question: 'First question?', clarity_score: 80, metadata: { tags: ['tag1'] } },
        },
        {
          brief_id: 'entry-2',
          read_at: '2025-01-02T11:00:00Z',
          time_spent_seconds: 180,
          reading_level_viewed: 'detailed',
          brief: { question: 'Second question?', clarity_score: 85, metadata: { tags: ['tag2'] } },
        },
        {
          brief_id: 'entry-3',
          read_at: '2025-01-03T12:00:00Z',
          time_spent_seconds: null,
          reading_level_viewed: null,
          brief: null,
        },
      ];

      expect(entries).toHaveLength(3);
      expect(entries[0].brief?.question).toBe('First question?');
      expect(entries[1].reading_level_viewed).toBe('detailed');
      expect(entries[2].brief).toBeNull();
    });

    it('should handle large arrays of entries', () => {
      const manyEntries: ReadingHistoryEntry[] = Array.from({ length: 100 }, (_, i) => ({
        brief_id: `brief-${i}`,
        read_at: new Date(2025, 0, 1 + i).toISOString(),
        time_spent_seconds: 60 + i * 10,
        reading_level_viewed: i % 3 === 0 ? 'standard' : i % 3 === 1 ? 'detailed' : 'expert',
        brief: {
          question: `Question ${i}?`,
          clarity_score: 50 + (i % 50),
          metadata: { tags: [`tag-${i}`] },
        },
      }));

      expect(manyEntries).toHaveLength(100);
      expect(manyEntries[0].brief_id).toBe('brief-0');
      expect(manyEntries[99].brief_id).toBe('brief-99');
    });
  });

  describe('Hook Behavior', () => {
    it('should call refetch without throwing', async () => {
      const { result } = renderHook(() => useReadingHistory());

      // refetch should not throw when called
      await expect(act(async () => {
        await result.current.refetch();
      })).resolves.not.toThrow();
    });

    it('should return refetch as a callable function after rerender', () => {
      const { result, rerender } = renderHook(() => useReadingHistory());

      expect(typeof result.current.refetch).toBe('function');

      rerender();

      // After rerender, refetch should still be a callable function
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should not throw when unmounting during initial render', () => {
      const { unmount } = renderHook(() => useReadingHistory());

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should have consistent return shape across multiple instantiations', () => {
      const { result: result1 } = renderHook(() => useReadingHistory());
      const { result: result2 } = renderHook(() => useReadingHistory());

      // Both should have same shape
      expect(Object.keys(result1.current).sort()).toEqual(Object.keys(result2.current).sort());
      expect(Object.keys(result1.current)).toContain('history');
      expect(Object.keys(result1.current)).toContain('isLoading');
      expect(Object.keys(result1.current)).toContain('error');
      expect(Object.keys(result1.current)).toContain('refetch');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in question text', () => {
      const entry: ReadingHistoryEntry = {
        brief_id: 'special-chars',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: {
          question: 'What about <script>alert("xss")</script> & "quotes" and \'apostrophes\'?',
          clarity_score: 75,
          metadata: null,
        },
      };

      expect(entry.brief?.question).toContain('<script>');
      expect(entry.brief?.question).toContain('&');
      expect(entry.brief?.question).toContain('"quotes"');
    });

    it('should handle very long question text', () => {
      const longQuestion = 'A'.repeat(10000);
      const entry: ReadingHistoryEntry = {
        brief_id: 'long-question',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: {
          question: longQuestion,
          clarity_score: 75,
          metadata: { tags: [] },
        },
      };

      expect(entry.brief?.question).toHaveLength(10000);
    });

    it('should handle unicode characters in question', () => {
      const entry: ReadingHistoryEntry = {
        brief_id: 'unicode',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: {
          question: 'What about emojis 🎉 and Chinese 中文?',
          clarity_score: 80,
          metadata: null,
        },
      };

      expect(entry.brief?.question).toContain('🎉');
      expect(entry.brief?.question).toContain('中文');
    });

    it('should handle many tags', () => {
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag-${i}`);
      const entry: ReadingHistoryEntry = {
        brief_id: 'many-tags',
        read_at: '2025-01-01T00:00:00Z',
        time_spent_seconds: 60,
        reading_level_viewed: 'standard',
        brief: {
          question: 'Entry with many tags?',
          clarity_score: 80,
          metadata: { tags: manyTags },
        },
      };

      expect(entry.brief?.metadata?.tags).toHaveLength(50);
    });
  });
});
