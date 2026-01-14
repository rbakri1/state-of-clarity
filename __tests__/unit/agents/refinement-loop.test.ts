/**
 * Refinement Loop Unit Tests
 *
 * Tests for the iterative brief refinement process.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FixerType, ConsensusResult, RefinementAttempt } from '@/lib/types/refinement';

// Mock orchestrateFixes and reconcileEdits
const mockOrchestrateFixes = vi.fn();
const mockReconcileEdits = vi.fn();

vi.mock('@/lib/agents/fixers/fixer-orchestrator', () => ({
  orchestrateFixes: (...args: any[]) => mockOrchestrateFixes(...args),
}));

vi.mock('@/lib/agents/fixers/edit-reconciliation-agent', () => ({
  reconcileEdits: (...args: any[]) => mockReconcileEdits(...args),
}));

// Mock the logger functions
vi.mock('@/lib/agents/refinement-logger', () => ({
  logRefinementAttempt: vi.fn().mockResolvedValue(undefined),
  logRefinementSummary: vi.fn().mockResolvedValue(undefined),
  logOrchestratorExecution: vi.fn().mockResolvedValue(undefined),
  logReconciliationExecution: vi.fn().mockResolvedValue(undefined),
}));

import { refineUntilPassing, RefinementLoopInput } from '@/lib/agents/refinement-loop';

describe('Refinement Loop', () => {
  const createMockConsensusResult = (overallScore: number): ConsensusResult => ({
    overallScore,
    dimensionScores: {
      [FixerType.firstPrinciplesCoherence]: overallScore - 0.5,
      [FixerType.internalConsistency]: overallScore,
      [FixerType.evidenceQuality]: overallScore - 1,
      [FixerType.accessibility]: overallScore + 0.5,
      [FixerType.objectivity]: overallScore - 0.5,
      [FixerType.factualAccuracy]: overallScore,
      [FixerType.biasDetection]: overallScore - 1,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Already Passing', () => {
    it('should return immediately if initial score meets target', async () => {
      const input: RefinementLoopInput = {
        brief: 'A well-written brief.',
        initialConsensusResult: createMockConsensusResult(8.5),
        scoringFunction: vi.fn(),
      };

      const result = await refineUntilPassing(input);

      expect(result.success).toBe(true);
      expect(result.attempts).toEqual([]);
      expect(result.finalScore).toBe(8.5);
      expect(result.finalBrief).toBe('A well-written brief.');
    });

    it('should not call scoringFunction if already passing', async () => {
      const scoringFunction = vi.fn();

      const input: RefinementLoopInput = {
        brief: 'Good brief.',
        initialConsensusResult: createMockConsensusResult(9.0),
        scoringFunction,
      };

      await refineUntilPassing(input);

      expect(scoringFunction).not.toHaveBeenCalled();
    });
  });

  describe('Successful Refinement', () => {
    it('should return success when target score is reached', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [FixerType.evidenceQuality],
        allSuggestedEdits: [{ section: 'Body', originalText: 'old', suggestedText: 'new', rationale: 'Better', priority: 'high' }],
        fixerResults: [],
      });

      mockReconcileEdits.mockResolvedValue({
        revisedBrief: 'Improved brief.',
        editsApplied: [{ section: 'Body', originalText: 'old', suggestedText: 'new', rationale: 'Better', priority: 'high' }],
        editsSkipped: [],
      });

      const scoringFunction = vi.fn().mockResolvedValue(createMockConsensusResult(8.5));

      const input: RefinementLoopInput = {
        brief: 'Initial brief.',
        initialConsensusResult: createMockConsensusResult(6.5),
        scoringFunction,
      };

      const result = await refineUntilPassing(input);

      expect(result.success).toBe(true);
      expect(result.finalScore).toBe(8.5);
      expect(result.attempts).toHaveLength(1);
    });

    it('should track score changes in attempts', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [FixerType.accessibility],
        allSuggestedEdits: [{ section: 'Intro', originalText: 'old', suggestedText: 'new', rationale: 'Clarity', priority: 'medium' }],
        fixerResults: [],
      });

      mockReconcileEdits.mockResolvedValue({
        revisedBrief: 'Better brief.',
        editsApplied: [{ section: 'Intro', originalText: 'old', suggestedText: 'new', rationale: 'Clarity', priority: 'medium' }],
        editsSkipped: [],
      });

      const scoringFunction = vi.fn().mockResolvedValue(createMockConsensusResult(8.2));

      const input: RefinementLoopInput = {
        brief: 'Original.',
        initialConsensusResult: createMockConsensusResult(7.0),
        scoringFunction,
      };

      const result = await refineUntilPassing(input);

      expect(result.attempts[0].scoreBeforeAfter.before).toBe(7.0);
      expect(result.attempts[0].scoreBeforeAfter.after).toBe(8.2);
    });
  });

  describe('Multiple Attempts', () => {
    it('should continue refining until target is reached', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [FixerType.objectivity],
        allSuggestedEdits: [{ section: 'Body', originalText: 'old', suggestedText: 'new', rationale: 'Balance', priority: 'high' }],
        fixerResults: [],
      });

      mockReconcileEdits.mockResolvedValue({
        revisedBrief: 'Refined brief.',
        editsApplied: [{ section: 'Body', originalText: 'old', suggestedText: 'new', rationale: 'Balance', priority: 'high' }],
        editsSkipped: [],
      });

      const scoringFunction = vi.fn()
        .mockResolvedValueOnce(createMockConsensusResult(7.0))
        .mockResolvedValueOnce(createMockConsensusResult(7.5))
        .mockResolvedValueOnce(createMockConsensusResult(8.0));

      const input: RefinementLoopInput = {
        brief: 'Initial.',
        initialConsensusResult: createMockConsensusResult(6.0),
        scoringFunction,
      };

      const result = await refineUntilPassing(input);

      expect(result.success).toBe(true);
      expect(result.attempts.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect maxAttempts limit', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [FixerType.biasDetection],
        allSuggestedEdits: [{ section: 'Body', originalText: 'old', suggestedText: 'new', rationale: 'Less bias', priority: 'critical' }],
        fixerResults: [],
      });

      mockReconcileEdits.mockResolvedValue({
        revisedBrief: 'Still not great.',
        editsApplied: [{ section: 'Body', originalText: 'old', suggestedText: 'new', rationale: 'Less bias', priority: 'critical' }],
        editsSkipped: [],
      });

      // Always return below target
      const scoringFunction = vi.fn().mockResolvedValue(createMockConsensusResult(7.0));

      const input: RefinementLoopInput = {
        brief: 'Original.',
        initialConsensusResult: createMockConsensusResult(6.0),
        scoringFunction,
        maxAttempts: 2,
      };

      const result = await refineUntilPassing(input);

      expect(result.success).toBe(false);
      expect(result.attempts.length).toBeLessThanOrEqual(2);
    });
  });

  describe('No Edits Possible', () => {
    it('should stop if no fixers are deployed', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [],
        allSuggestedEdits: [],
        fixerResults: [],
      });

      const scoringFunction = vi.fn();

      const input: RefinementLoopInput = {
        brief: 'Brief.',
        initialConsensusResult: createMockConsensusResult(7.5),
        scoringFunction,
      };

      const result = await refineUntilPassing(input);

      expect(result.success).toBe(false);
      expect(scoringFunction).not.toHaveBeenCalled();
    });

    it('should stop if no edits are suggested', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [FixerType.accessibility],
        allSuggestedEdits: [],
        fixerResults: [],
      });

      const scoringFunction = vi.fn();

      const input: RefinementLoopInput = {
        brief: 'Brief.',
        initialConsensusResult: createMockConsensusResult(7.0),
        scoringFunction,
      };

      const result = await refineUntilPassing(input);

      expect(result.success).toBe(false);
    });

    it('should stop if no edits are applied after reconciliation', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [FixerType.internalConsistency],
        allSuggestedEdits: [{ section: 'Body', originalText: 'x', suggestedText: 'y', rationale: 'Reason', priority: 'low' }],
        fixerResults: [],
      });

      mockReconcileEdits.mockResolvedValue({
        revisedBrief: null,
        editsApplied: [],
        editsSkipped: [],
      });

      const scoringFunction = vi.fn();

      const input: RefinementLoopInput = {
        brief: 'Brief.',
        initialConsensusResult: createMockConsensusResult(7.0),
        scoringFunction,
      };

      const result = await refineUntilPassing(input);

      expect(result.success).toBe(false);
      expect(scoringFunction).not.toHaveBeenCalled();
    });
  });

  describe('Failed Refinement', () => {
    it('should include warning reason on failure', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [FixerType.factualAccuracy],
        allSuggestedEdits: [{ section: 'Body', originalText: 'old', suggestedText: 'new', rationale: 'Accuracy', priority: 'high' }],
        fixerResults: [],
      });

      mockReconcileEdits.mockResolvedValue({
        revisedBrief: 'Still bad.',
        editsApplied: [{ section: 'Body', originalText: 'old', suggestedText: 'new', rationale: 'Accuracy', priority: 'high' }],
        editsSkipped: [],
      });

      const scoringFunction = vi.fn().mockResolvedValue(createMockConsensusResult(6.5));

      const input: RefinementLoopInput = {
        brief: 'Original.',
        initialConsensusResult: createMockConsensusResult(6.0),
        scoringFunction,
        maxAttempts: 1,
      };

      const result = await refineUntilPassing(input);

      expect(result.success).toBe(false);
      expect(result.warningReason).toBeDefined();
      expect(result.warningReason).toContain('6.5');
    });

    it('should track total processing time', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [],
        allSuggestedEdits: [],
        fixerResults: [],
      });

      const input: RefinementLoopInput = {
        brief: 'Brief.',
        initialConsensusResult: createMockConsensusResult(7.0),
        scoringFunction: vi.fn(),
      };

      const result = await refineUntilPassing(input);

      expect(result.totalProcessingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Dimension Score Tracking', () => {
    it('should track dimension score changes across attempts', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [FixerType.evidenceQuality],
        allSuggestedEdits: [{ section: 'Sources', originalText: 'old', suggestedText: 'new', rationale: 'Better sources', priority: 'critical' }],
        fixerResults: [],
      });

      mockReconcileEdits.mockResolvedValue({
        revisedBrief: 'Better sourced brief.',
        editsApplied: [{ section: 'Sources', originalText: 'old', suggestedText: 'new', rationale: 'Better sources', priority: 'critical' }],
        editsSkipped: [],
      });

      const initialResult = createMockConsensusResult(6.0);
      const improvedResult = createMockConsensusResult(8.5);

      const scoringFunction = vi.fn().mockResolvedValue(improvedResult);

      const input: RefinementLoopInput = {
        brief: 'Original.',
        initialConsensusResult: initialResult,
        scoringFunction,
      };

      const result = await refineUntilPassing(input);

      expect(result.attempts[0].scoreBeforeAfter.dimensionScores).toBeDefined();
    });
  });

  describe('Sources Handling', () => {
    it('should pass sources to orchestrator', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [],
        allSuggestedEdits: [],
        fixerResults: [],
      });

      const sources = [
        { url: 'https://example.com', title: 'Example', content: 'Content' },
      ];

      const input: RefinementLoopInput = {
        brief: 'Brief.',
        initialConsensusResult: createMockConsensusResult(7.0),
        scoringFunction: vi.fn(),
        sources,
      };

      await refineUntilPassing(input);

      expect(mockOrchestrateFixes).toHaveBeenCalledWith(
        expect.objectContaining({ sources })
      );
    });
  });

  describe('Processing Time Tracking', () => {
    it('should track processing time per attempt', async () => {
      mockOrchestrateFixes.mockResolvedValue({
        fixersDeployed: [FixerType.accessibility],
        allSuggestedEdits: [{ section: 'Intro', originalText: 'old', suggestedText: 'new', rationale: 'Clarity', priority: 'medium' }],
        fixerResults: [],
      });

      mockReconcileEdits.mockResolvedValue({
        revisedBrief: 'Better.',
        editsApplied: [{ section: 'Intro', originalText: 'old', suggestedText: 'new', rationale: 'Clarity', priority: 'medium' }],
        editsSkipped: [],
      });

      const scoringFunction = vi.fn().mockResolvedValue(createMockConsensusResult(8.5));

      const input: RefinementLoopInput = {
        brief: 'Original.',
        initialConsensusResult: createMockConsensusResult(7.0),
        scoringFunction,
      };

      const result = await refineUntilPassing(input);

      expect(result.attempts[0].processingTime).toBeGreaterThanOrEqual(0);
    });
  });
});
