/**
 * Fixer Orchestrator Unit Tests
 *
 * Tests for the fixer orchestrator that deploys appropriate fixer agents
 * based on dimension scores from consensus evaluation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FixerType, ConsensusResult, FixerResult } from '@/lib/types/refinement';

// Mock all fixer classes
const mockSuggestEdits = vi.fn();

vi.mock('@/lib/agents/fixers/first-principles-fixer', () => ({
  FirstPrinciplesFixer: vi.fn().mockImplementation(() => ({
    suggestEdits: mockSuggestEdits,
  })),
}));

vi.mock('@/lib/agents/fixers/consistency-fixer', () => ({
  ConsistencyFixer: vi.fn().mockImplementation(() => ({
    suggestEdits: mockSuggestEdits,
  })),
}));

vi.mock('@/lib/agents/fixers/evidence-fixer', () => ({
  EvidenceFixer: vi.fn().mockImplementation(() => ({
    suggestEdits: mockSuggestEdits,
  })),
}));

vi.mock('@/lib/agents/fixers/accessibility-fixer', () => ({
  AccessibilityFixer: vi.fn().mockImplementation(() => ({
    suggestEdits: mockSuggestEdits,
  })),
}));

vi.mock('@/lib/agents/fixers/objectivity-fixer', () => ({
  ObjectivityFixer: vi.fn().mockImplementation(() => ({
    suggestEdits: mockSuggestEdits,
  })),
}));

vi.mock('@/lib/agents/fixers/factual-accuracy-fixer', () => ({
  FactualAccuracyFixer: vi.fn().mockImplementation(() => ({
    suggestEdits: mockSuggestEdits,
  })),
}));

vi.mock('@/lib/agents/fixers/bias-fixer', () => ({
  BiasFixer: vi.fn().mockImplementation(() => ({
    suggestEdits: mockSuggestEdits,
  })),
}));

import { orchestrateFixes, OrchestratorInput } from '@/lib/agents/fixers/fixer-orchestrator';

describe('Fixer Orchestrator', () => {
  const createMockConsensusResult = (overrides: Partial<ConsensusResult['dimensionScores']> = {}): ConsensusResult => ({
    overallScore: 7.0,
    dimensionScores: {
      [FixerType.firstPrinciplesCoherence]: 8.0,
      [FixerType.internalConsistency]: 8.0,
      [FixerType.evidenceQuality]: 8.0,
      [FixerType.accessibility]: 8.0,
      [FixerType.objectivity]: 8.0,
      [FixerType.factualAccuracy]: 8.0,
      [FixerType.biasDetection]: 8.0,
      ...overrides,
    },
    dimensionCritiques: {
      [FixerType.firstPrinciplesCoherence]: '',
      [FixerType.internalConsistency]: '',
      [FixerType.evidenceQuality]: '',
      [FixerType.accessibility]: '',
      [FixerType.objectivity]: '',
      [FixerType.factualAccuracy]: '',
      [FixerType.biasDetection]: '',
    },
  });

  const createMockFixerResult = (fixerType: FixerType): FixerResult => ({
    fixerType,
    suggestedEdits: [
      {
        section: 'Test Section',
        originalText: 'old text',
        suggestedText: 'new text',
        rationale: 'Better clarity',
        priority: 'medium',
      },
    ],
    confidence: 0.8,
    processingTime: 100,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSuggestEdits.mockResolvedValue(createMockFixerResult(FixerType.accessibility));
  });

  describe('Fixer Deployment', () => {
    it('should not deploy any fixers when all dimensions score >= 7.0', async () => {
      const input: OrchestratorInput = {
        brief: 'A well-written brief.',
        consensusResult: createMockConsensusResult(),
      };

      const result = await orchestrateFixes(input);

      expect(result.fixersDeployed).toEqual([]);
      expect(result.fixerResults).toEqual([]);
      expect(result.allSuggestedEdits).toEqual([]);
      expect(mockSuggestEdits).not.toHaveBeenCalled();
    });

    it('should deploy a fixer for a dimension scoring below 7.0', async () => {
      const input: OrchestratorInput = {
        brief: 'A brief needing accessibility improvements.',
        consensusResult: createMockConsensusResult({
          [FixerType.accessibility]: 5.5,
        }),
      };

      const result = await orchestrateFixes(input);

      expect(result.fixersDeployed).toContain(FixerType.accessibility);
      expect(mockSuggestEdits).toHaveBeenCalledTimes(1);
    });

    it('should deploy multiple fixers for multiple low-scoring dimensions', async () => {
      mockSuggestEdits
        .mockResolvedValueOnce(createMockFixerResult(FixerType.accessibility))
        .mockResolvedValueOnce(createMockFixerResult(FixerType.evidenceQuality))
        .mockResolvedValueOnce(createMockFixerResult(FixerType.biasDetection));

      const input: OrchestratorInput = {
        brief: 'A brief needing multiple improvements.',
        consensusResult: createMockConsensusResult({
          [FixerType.accessibility]: 5.0,
          [FixerType.evidenceQuality]: 6.5,
          [FixerType.biasDetection]: 4.0,
        }),
      };

      const result = await orchestrateFixes(input);

      expect(result.fixersDeployed).toHaveLength(3);
      expect(result.fixersDeployed).toContain(FixerType.accessibility);
      expect(result.fixersDeployed).toContain(FixerType.evidenceQuality);
      expect(result.fixersDeployed).toContain(FixerType.biasDetection);
      expect(mockSuggestEdits).toHaveBeenCalledTimes(3);
    });

    it('should deploy all fixers when all dimensions score below 7.0', async () => {
      const allLowScores = {
        [FixerType.firstPrinciplesCoherence]: 5.0,
        [FixerType.internalConsistency]: 5.5,
        [FixerType.evidenceQuality]: 6.0,
        [FixerType.accessibility]: 5.0,
        [FixerType.objectivity]: 6.5,
        [FixerType.factualAccuracy]: 4.5,
        [FixerType.biasDetection]: 5.5,
      };

      const input: OrchestratorInput = {
        brief: 'A poorly written brief.',
        consensusResult: createMockConsensusResult(allLowScores),
      };

      const result = await orchestrateFixes(input);

      expect(result.fixersDeployed).toHaveLength(7);
      expect(mockSuggestEdits).toHaveBeenCalledTimes(7);
    });
  });

  describe('Suggested Edits Collection', () => {
    it('should collect all suggested edits from all deployed fixers', async () => {
      const multiEditResult: FixerResult = {
        fixerType: FixerType.accessibility,
        suggestedEdits: [
          { section: 'Intro', originalText: 'old1', suggestedText: 'new1', rationale: 'R1', priority: 'high' },
          { section: 'Body', originalText: 'old2', suggestedText: 'new2', rationale: 'R2', priority: 'medium' },
        ],
        confidence: 0.9,
        processingTime: 150,
      };

      mockSuggestEdits.mockResolvedValue(multiEditResult);

      const input: OrchestratorInput = {
        brief: 'A brief.',
        consensusResult: createMockConsensusResult({
          [FixerType.accessibility]: 5.0,
        }),
      };

      const result = await orchestrateFixes(input);

      expect(result.allSuggestedEdits).toHaveLength(2);
    });

    it('should return empty edits when no fixers suggest any edits', async () => {
      mockSuggestEdits.mockResolvedValue({
        fixerType: FixerType.accessibility,
        suggestedEdits: [],
        confidence: 0.5,
        processingTime: 50,
      });

      const input: OrchestratorInput = {
        brief: 'A brief.',
        consensusResult: createMockConsensusResult({
          [FixerType.accessibility]: 6.0,
        }),
      };

      const result = await orchestrateFixes(input);

      expect(result.allSuggestedEdits).toEqual([]);
    });
  });

  describe('Processing Time', () => {
    it('should track total processing time', async () => {
      const input: OrchestratorInput = {
        brief: 'A brief.',
        consensusResult: createMockConsensusResult(),
      };

      const result = await orchestrateFixes(input);

      expect(result.totalProcessingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sources Handling', () => {
    it('should pass sources to fixer input', async () => {
      const sources = [
        { url: 'https://example.com', title: 'Example', content: 'Content' },
      ];

      const input: OrchestratorInput = {
        brief: 'A brief.',
        consensusResult: createMockConsensusResult({
          [FixerType.evidenceQuality]: 5.0,
        }),
        sources,
      };

      await orchestrateFixes(input);

      expect(mockSuggestEdits).toHaveBeenCalledWith(
        expect.objectContaining({ sources })
      );
    });
  });

  describe('Fixer Input Construction', () => {
    it('should pass correct dimension score to fixer', async () => {
      const input: OrchestratorInput = {
        brief: 'A brief.',
        consensusResult: createMockConsensusResult({
          [FixerType.accessibility]: 5.5,
        }),
      };

      await orchestrateFixes(input);

      expect(mockSuggestEdits).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensionScore: 5.5,
        })
      );
    });

    it('should pass brief text to fixer', async () => {
      const briefText = 'This is the brief content.';

      const input: OrchestratorInput = {
        brief: briefText,
        consensusResult: createMockConsensusResult({
          [FixerType.objectivity]: 6.0,
        }),
      };

      await orchestrateFixes(input);

      expect(mockSuggestEdits).toHaveBeenCalledWith(
        expect.objectContaining({
          brief: briefText,
        })
      );
    });
  });

  describe('Parallel Execution', () => {
    it('should execute fixers in parallel', async () => {
      let callOrder: FixerType[] = [];

      mockSuggestEdits.mockImplementation(async (input) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        callOrder.push(FixerType.accessibility); // Mock tracking
        return createMockFixerResult(FixerType.accessibility);
      });

      const input: OrchestratorInput = {
        brief: 'A brief.',
        consensusResult: createMockConsensusResult({
          [FixerType.accessibility]: 5.0,
          [FixerType.biasDetection]: 5.0,
        }),
      };

      const startTime = Date.now();
      await orchestrateFixes(input);
      const elapsed = Date.now() - startTime;

      // If running in parallel, should take ~10ms not ~20ms
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('Score Threshold', () => {
    it('should not deploy fixer for dimension scoring exactly 7.0', async () => {
      const input: OrchestratorInput = {
        brief: 'A brief.',
        consensusResult: createMockConsensusResult({
          [FixerType.accessibility]: 7.0,
        }),
      };

      const result = await orchestrateFixes(input);

      expect(result.fixersDeployed).not.toContain(FixerType.accessibility);
    });

    it('should deploy fixer for dimension scoring 6.9', async () => {
      const input: OrchestratorInput = {
        brief: 'A brief.',
        consensusResult: createMockConsensusResult({
          [FixerType.accessibility]: 6.9,
        }),
      };

      const result = await orchestrateFixes(input);

      expect(result.fixersDeployed).toContain(FixerType.accessibility);
    });
  });
});
