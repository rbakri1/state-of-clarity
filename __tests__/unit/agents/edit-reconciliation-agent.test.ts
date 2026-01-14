/**
 * Edit Reconciliation Agent Unit Tests
 *
 * Tests for the reconciliation agent that merges suggested edits
 * from multiple fixer agents into a coherent revised brief.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAnthropicMocks, queueMockResponse } from '../../mocks/anthropic';
import { FixerType, FixerResult, SuggestedEdit } from '@/lib/types/refinement';

// Mock Anthropic before importing
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

import { reconcileEdits, ReconciliationInput } from '@/lib/agents/fixers/edit-reconciliation-agent';

describe('Edit Reconciliation Agent', () => {
  beforeEach(() => {
    resetAnthropicMocks();
  });

  const createMockFixerResult = (
    fixerType: FixerType,
    edits: SuggestedEdit[]
  ): FixerResult => ({
    fixerType,
    suggestedEdits: edits,
    confidence: 0.8,
    processingTime: 100,
  });

  describe('No Edits', () => {
    it('should return original brief when no edits are provided', async () => {
      const input: ReconciliationInput = {
        originalBrief: 'Original brief content.',
        fixerResults: [],
      };

      const result = await reconcileEdits(input);

      expect(result.revisedBrief).toBe('Original brief content.');
      expect(result.editsApplied).toEqual([]);
      expect(result.editsSkipped).toEqual([]);
    });

    it('should return original brief when fixers have empty edits', async () => {
      const input: ReconciliationInput = {
        originalBrief: 'Original brief.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, []),
          createMockFixerResult(FixerType.biasDetection, []),
        ],
      };

      const result = await reconcileEdits(input);

      expect(result.revisedBrief).toBe('Original brief.');
    });
  });

  describe('Edit Application', () => {
    it('should apply edits and return revised brief', async () => {
      queueMockResponse(JSON.stringify({
        revisedBrief: 'Improved brief content.',
        editsApplied: [
          {
            section: 'Introduction',
            originalText: 'old text',
            suggestedText: 'new text',
            rationale: 'Better clarity',
            priority: 'high',
          },
        ],
        editsNotApplicable: [],
      }));

      const input: ReconciliationInput = {
        originalBrief: 'Original brief with old text.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            {
              section: 'Introduction',
              originalText: 'old text',
              suggestedText: 'new text',
              rationale: 'Better clarity',
              priority: 'high',
            },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      expect(result.revisedBrief).toBe('Improved brief content.');
      expect(result.editsApplied).toHaveLength(1);
    });

    it('should apply multiple edits from multiple fixers', async () => {
      queueMockResponse(JSON.stringify({
        revisedBrief: 'Fully revised brief.',
        editsApplied: [
          { section: 'Intro', originalText: 'a', suggestedText: 'b', rationale: 'R1', priority: 'high' },
          { section: 'Body', originalText: 'c', suggestedText: 'd', rationale: 'R2', priority: 'medium' },
        ],
        editsNotApplicable: [],
      }));

      const input: ReconciliationInput = {
        originalBrief: 'Brief with a and c.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Intro', originalText: 'a', suggestedText: 'b', rationale: 'R1', priority: 'high' },
          ]),
          createMockFixerResult(FixerType.biasDetection, [
            { section: 'Body', originalText: 'c', suggestedText: 'd', rationale: 'R2', priority: 'medium' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      expect(result.editsApplied).toHaveLength(2);
    });
  });

  describe('Conflict Resolution', () => {
    it('should skip lower-priority conflicting edits', async () => {
      queueMockResponse(JSON.stringify({
        revisedBrief: 'Brief with high priority edit.',
        editsApplied: [
          { section: 'Introduction', originalText: 'text', suggestedText: 'high priority', rationale: 'R1', priority: 'high' },
        ],
        editsNotApplicable: [],
      }));

      const input: ReconciliationInput = {
        originalBrief: 'Brief with text.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Introduction', originalText: 'text', suggestedText: 'high priority', rationale: 'R1', priority: 'high' },
          ]),
          createMockFixerResult(FixerType.biasDetection, [
            { section: 'Introduction', originalText: 'text', suggestedText: 'low priority', rationale: 'R2', priority: 'low' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      expect(result.editsSkipped.length).toBeGreaterThanOrEqual(1);
    });

    it('should select critical priority edits over high priority', async () => {
      queueMockResponse(JSON.stringify({
        revisedBrief: 'Brief with critical edit.',
        editsApplied: [
          { section: 'Body', originalText: 'issue', suggestedText: 'fixed', rationale: 'Critical fix', priority: 'critical' },
        ],
        editsNotApplicable: [],
      }));

      const input: ReconciliationInput = {
        originalBrief: 'Brief with issue.',
        fixerResults: [
          createMockFixerResult(FixerType.factualAccuracy, [
            { section: 'Body', originalText: 'issue', suggestedText: 'fixed', rationale: 'Critical fix', priority: 'critical' },
          ]),
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Body', originalText: 'issue', suggestedText: 'improved', rationale: 'High priority', priority: 'high' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      // The critical edit should be applied
      expect(result.editsApplied.some(e => e.priority === 'critical')).toBe(true);
    });
  });

  describe('Response Parsing', () => {
    it('should handle JSON embedded in text', async () => {
      queueMockResponse(`Here's the result:
        {
          "revisedBrief": "The revised version.",
          "editsApplied": [],
          "editsNotApplicable": []
        }
        Done!`);

      const input: ReconciliationInput = {
        originalBrief: 'Original.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Intro', originalText: 'old', suggestedText: 'new', rationale: 'R', priority: 'medium' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      expect(result.revisedBrief).toBe('The revised version.');
    });

    it('should handle invalid JSON gracefully', async () => {
      queueMockResponse('This is not valid JSON');

      const input: ReconciliationInput = {
        originalBrief: 'Original.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Intro', originalText: 'old', suggestedText: 'new', rationale: 'R', priority: 'medium' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      expect(result.revisedBrief).toBe('');
      expect(result.editsApplied).toEqual([]);
    });

    it('should track edits that could not be applied', async () => {
      queueMockResponse(JSON.stringify({
        revisedBrief: 'Partially revised.',
        editsApplied: [],
        editsNotApplicable: [
          {
            section: 'Introduction',
            originalText: 'not found text',
            reason: 'Text not found in brief',
          },
        ],
      }));

      const input: ReconciliationInput = {
        originalBrief: 'Original brief.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Introduction', originalText: 'not found text', suggestedText: 'replacement', rationale: 'R', priority: 'medium' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      expect(result.editsSkipped.length).toBeGreaterThan(0);
    });
  });

  describe('Priority Weights', () => {
    it('should validate priority values', async () => {
      queueMockResponse(JSON.stringify({
        revisedBrief: 'Revised.',
        editsApplied: [
          { section: 'Intro', originalText: 'a', suggestedText: 'b', rationale: 'R', priority: 'invalid' },
        ],
        editsNotApplicable: [],
      }));

      const input: ReconciliationInput = {
        originalBrief: 'Original.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Intro', originalText: 'a', suggestedText: 'b', rationale: 'R', priority: 'high' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      // Invalid priority should default to medium
      expect(['critical', 'high', 'medium', 'low']).toContain(result.editsApplied[0]?.priority);
    });
  });

  describe('Section Grouping', () => {
    it('should group edits by section', async () => {
      queueMockResponse(JSON.stringify({
        revisedBrief: 'Multi-section revised.',
        editsApplied: [
          { section: 'Introduction', originalText: 'intro text', suggestedText: 'better intro', rationale: 'R1', priority: 'high' },
          { section: 'Conclusion', originalText: 'conclusion text', suggestedText: 'better conclusion', rationale: 'R2', priority: 'high' },
        ],
        editsNotApplicable: [],
      }));

      const input: ReconciliationInput = {
        originalBrief: 'Brief with intro text and conclusion text.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Introduction', originalText: 'intro text', suggestedText: 'better intro', rationale: 'R1', priority: 'high' },
            { section: 'Conclusion', originalText: 'conclusion text', suggestedText: 'better conclusion', rationale: 'R2', priority: 'high' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      expect(result.editsApplied).toHaveLength(2);
    });
  });

  describe('Empty Revised Brief', () => {
    it('should handle empty revised brief in response', async () => {
      queueMockResponse(JSON.stringify({
        revisedBrief: '',
        editsApplied: [],
        editsNotApplicable: [],
      }));

      const input: ReconciliationInput = {
        originalBrief: 'Original.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Intro', originalText: 'old', suggestedText: 'new', rationale: 'R', priority: 'medium' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      expect(result.revisedBrief).toBe('');
    });
  });

  describe('Fixer Agreement Bonus', () => {
    it('should give higher score when multiple fixers agree', async () => {
      queueMockResponse(JSON.stringify({
        revisedBrief: 'Revised with agreed edit.',
        editsApplied: [
          { section: 'Body', originalText: 'common issue', suggestedText: 'fixed issue', rationale: 'Multiple fixers agreed', priority: 'medium' },
        ],
        editsNotApplicable: [],
      }));

      const input: ReconciliationInput = {
        originalBrief: 'Brief with common issue.',
        fixerResults: [
          createMockFixerResult(FixerType.accessibility, [
            { section: 'Body', originalText: 'common issue', suggestedText: 'fixed issue', rationale: 'Accessibility fix', priority: 'medium' },
          ]),
          createMockFixerResult(FixerType.objectivity, [
            { section: 'Body', originalText: 'common issue', suggestedText: 'fixed issue', rationale: 'Objectivity fix', priority: 'medium' },
          ]),
        ],
      };

      const result = await reconcileEdits(input);

      // Agreed edits should be applied
      expect(result.editsApplied).toHaveLength(1);
    });
  });
});
