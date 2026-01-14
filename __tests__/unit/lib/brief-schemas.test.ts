/**
 * Brief Schemas Unit Tests
 *
 * Tests for Zod validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  briefIdSchema,
  createBriefSchema,
  updateBriefSchema,
  popularBriefsQuerySchema,
  exploreBriefsQuerySchema,
} from '@/lib/validation/brief-schemas';

describe('Brief Schemas', () => {
  describe('briefIdSchema', () => {
    it('should accept valid UUID', () => {
      const result = briefIdSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = briefIdSchema.safeParse('invalid-uuid');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = briefIdSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should provide error message', () => {
      const result = briefIdSchema.safeParse('not-a-uuid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('UUID');
      }
    });
  });

  describe('createBriefSchema', () => {
    it('should accept valid brief data', () => {
      const validData = {
        question: 'What is climate change?',
        narrative: 'Climate change refers to...',
        summaries: { key: 'value' },
        structured_data: {},
      };

      const result = createBriefSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty question', () => {
      const data = {
        question: '',
        narrative: 'Some narrative',
      };

      const result = createBriefSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty narrative', () => {
      const data = {
        question: 'Valid question',
        narrative: '',
      };

      const result = createBriefSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject question over 1000 characters', () => {
      const data = {
        question: 'x'.repeat(1001),
        narrative: 'Valid narrative',
      };

      const result = createBriefSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept optional clarity_score', () => {
      const data = {
        question: 'Valid question',
        narrative: 'Valid narrative',
        clarity_score: 8.5,
      };

      const result = createBriefSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept null clarity_score', () => {
      const data = {
        question: 'Valid question',
        narrative: 'Valid narrative',
        clarity_score: null,
      };

      const result = createBriefSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject clarity_score over 100', () => {
      const data = {
        question: 'Valid question',
        narrative: 'Valid narrative',
        clarity_score: 150,
      };

      const result = createBriefSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid user_id UUID', () => {
      const data = {
        question: 'Valid question',
        narrative: 'Valid narrative',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = createBriefSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('updateBriefSchema', () => {
    it('should accept partial updates', () => {
      const result = updateBriefSchema.safeParse({ narrative: 'Updated narrative' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateBriefSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject empty narrative', () => {
      const result = updateBriefSchema.safeParse({ narrative: '' });
      expect(result.success).toBe(false);
    });

    it('should accept updated clarity_score', () => {
      const result = updateBriefSchema.safeParse({ clarity_score: 9.0 });
      expect(result.success).toBe(true);
    });
  });

  describe('popularBriefsQuerySchema', () => {
    it('should use default limit', () => {
      const result = popularBriefsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('should accept custom limit', () => {
      const result = popularBriefsQuerySchema.safeParse({ limit: '25' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it('should coerce string to number', () => {
      const result = popularBriefsQuerySchema.safeParse({ limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('should reject limit under 1', () => {
      const result = popularBriefsQuerySchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = popularBriefsQuerySchema.safeParse({ limit: '101' });
      expect(result.success).toBe(false);
    });
  });

  describe('exploreBriefsQuerySchema', () => {
    it('should use default values', () => {
      const result = exploreBriefsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe('newest');
        expect(result.data.date).toBe('all');
        expect(result.data.limit).toBe(12);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should accept valid search query', () => {
      const result = exploreBriefsQuerySchema.safeParse({ q: 'climate change' });
      expect(result.success).toBe(true);
    });

    it('should accept valid tags', () => {
      const result = exploreBriefsQuerySchema.safeParse({ tags: 'Economy,Healthcare' });
      expect(result.success).toBe(true);
    });

    it('should accept valid minScore', () => {
      const result = exploreBriefsQuerySchema.safeParse({ minScore: '7' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minScore).toBe(7);
      }
    });

    it('should reject minScore over 10', () => {
      const result = exploreBriefsQuerySchema.safeParse({ minScore: '15' });
      expect(result.success).toBe(false);
    });

    it('should reject minScore under 0', () => {
      const result = exploreBriefsQuerySchema.safeParse({ minScore: '-1' });
      expect(result.success).toBe(false);
    });

    it('should accept valid sort values', () => {
      const sortValues = ['newest', 'oldest', 'score', 'views'];
      for (const sort of sortValues) {
        const result = exploreBriefsQuerySchema.safeParse({ sort });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid sort value', () => {
      const result = exploreBriefsQuerySchema.safeParse({ sort: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept valid date values', () => {
      const dateValues = ['week', 'month', 'year', 'all'];
      for (const date of dateValues) {
        const result = exploreBriefsQuerySchema.safeParse({ date });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid date value', () => {
      const result = exploreBriefsQuerySchema.safeParse({ date: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const result = exploreBriefsQuerySchema.safeParse({ offset: '-5' });
      expect(result.success).toBe(false);
    });
  });
});
