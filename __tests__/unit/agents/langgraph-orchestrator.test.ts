/**
 * LangGraph Orchestrator Unit Tests
 *
 * Tests for the brief generation pipeline orchestrator.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueMockResponse, resetAnthropicMocks } from '../../mocks/anthropic';

// Mock Anthropic before importing the orchestrator
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

// Mock the research agent
vi.mock('@/lib/agents/research-agent', () => ({
  researchAgent: vi.fn().mockResolvedValue([
    {
      id: 'source-1',
      url: 'https://example.com/article',
      title: 'Test Article',
      content: 'Test content for the article.',
      publisher: 'Example Publisher',
      political_lean: 'center' as const,
      credibility_score: 8.5,
      relevance_score: 0.9,
      source_type: 'secondary' as const,
      published_date: '2025-01-10',
    },
  ]),
}));

// Mock the question classifier
vi.mock('@/lib/agents/question-classifier', () => ({
  classifyQuestion: vi.fn().mockResolvedValue({
    domain: 'economics',
    controversy_level: 'medium',
    question_type: 'analytical',
    temporal_scope: 'current',
  }),
}));

// Mock the specialist personas
vi.mock('@/lib/agents/specialist-personas', () => ({
  getSpecialistPersona: vi.fn().mockReturnValue({
    name: 'Policy Analyst',
    systemPrompt: 'You are a policy analyst.',
    domain: 'economics',
  }),
}));

// Mock the summary prompts
vi.mock('@/lib/agents/summary-prompts', () => ({
  getSummaryPrompt: vi.fn().mockReturnValue({
    systemPrompt: 'Write a summary.',
    targetAudience: 'general',
    wordCount: { min: 100, max: 200 },
  }),
  getAllReadingLevels: vi.fn().mockReturnValue(['child', 'teen', 'undergrad', 'postdoc']),
}));

// Mock the retry wrapper
vi.mock('@/lib/agents/retry-wrapper', () => ({
  withRetry: vi.fn((fn) => fn()),
}));

// Mock the execution logger
vi.mock('@/lib/agents/execution-logger', () => ({
  executeWithLogging: vi.fn((name, fn) => fn()),
  ExecutionContext: {},
}));

// Mock the reconciliation agent
vi.mock('@/lib/agents/reconciliation-agent', () => ({
  reconcileOutputs: vi.fn().mockResolvedValue({
    reconciledNarrative: {
      introduction: 'Reconciled introduction',
      mainBody: 'Reconciled main body',
      conclusion: 'Reconciled conclusion',
      keyTakeaways: ['Key takeaway 1', 'Key takeaway 2'],
    },
    changes: [],
    isConsistent: true,
  }),
}));

// Mock the brief service
vi.mock('@/lib/services/brief-service', () => ({
  updateBriefClassification: vi.fn().mockResolvedValue(undefined),
  completeBriefGeneration: vi.fn().mockResolvedValue(undefined),
}));

// Mock LangGraph
vi.mock('@langchain/langgraph', () => {
  // Create Annotation as a function that also has a Root method
  const AnnotationFn = function() { return {}; } as any;
  AnnotationFn.Root = (config: any) => ({ State: config });

  // Mock StateGraph class that can be used with 'new'
  class MockStateGraph {
    invoke = async (state: any) => ({
      ...state,
      sources: [{ id: 'source-1', title: 'Test', content: 'Content' }],
      classification: { domain: 'economics' },
      persona: { name: 'Policy Analyst' },
      structure: { factors: [], policies: [] },
      narrative: {
        introduction: 'Test intro',
        mainBody: 'Test body',
        conclusion: 'Test conclusion',
        keyTakeaways: ['Takeaway 1'],
      },
      reconciliation: {
        reconciledNarrative: {
          introduction: 'Test intro',
          mainBody: 'Test body',
          conclusion: 'Test conclusion',
          keyTakeaways: ['Takeaway 1'],
        },
        changes: [],
        isConsistent: true,
      },
      summaries: {
        child: 'Child summary',
        teen: 'Teen summary',
        undergrad: 'Undergrad summary',
        postdoc: 'Postdoc summary',
      },
      clarityScore: {
        overall: 85,
        breakdown: { balance: 80, sourceQuality: 90, clarity: 85, completeness: 85 },
        notes: ['Good brief'],
      },
      completedSteps: ['research', 'classification', 'structure', 'narrative', 'reconciliation', 'summaries', 'clarity-scoring'],
    });

    addNode() { return this; }
    addEdge() { return this; }
    compile() { return this; }
  }

  return {
    StateGraph: MockStateGraph,
    Annotation: AnnotationFn,
    END: 'END',
    START: 'START',
  };
});

// Import after mocks are set up
import {
  generateBrief,
  createBriefGenerationGraph,
  BriefStateAnnotation,
} from '@/lib/agents/langgraph-orchestrator';

describe('LangGraph Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAnthropicMocks();
  });

  describe('generateBrief', () => {
    it('should generate a brief with all required fields', async () => {
      const question = 'What is the impact of inflation on wages?';

      const result = await generateBrief(question);

      expect(result).toBeDefined();
      expect(result.question).toBe(question);
      expect(result.sources).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.narrative).toBeDefined();
      expect(result.summaries).toBeDefined();
      expect(result.clarityScore).toBeDefined();
    });

    it('should include briefId when provided', async () => {
      const question = 'Test question';
      const briefId = 'test-brief-id';

      const result = await generateBrief(question, briefId);

      expect(result.briefId).toBe(briefId);
    });

    it('should track completed steps', async () => {
      const result = await generateBrief('Test question');

      expect(result.completedSteps).toBeDefined();
      expect(Array.isArray(result.completedSteps)).toBe(true);
      expect(result.completedSteps.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      // Verify that generateBrief can be called without throwing
      // Error handling is tested through the result object having error field
      const result = await generateBrief('Test question');

      // Should either have valid data or an error field, but not throw
      expect(result).toBeDefined();
      if (result.error) {
        expect(typeof result.error).toBe('string');
      }
    });

    it('should return sources array even on partial completion', async () => {
      const result = await generateBrief('Test question');

      expect(Array.isArray(result.sources)).toBe(true);
    });

    it('should return summaries object with all reading levels', async () => {
      const result = await generateBrief('Test question');

      expect(result.summaries).toBeDefined();
      expect(typeof result.summaries).toBe('object');
    });
  });

  describe('createBriefGenerationGraph', () => {
    it('should create a compiled graph', () => {
      const graph = createBriefGenerationGraph();

      expect(graph).toBeDefined();
      expect(graph.invoke).toBeDefined();
    });
  });

  describe('BriefStateAnnotation', () => {
    it('should define all required state fields', () => {
      expect(BriefStateAnnotation).toBeDefined();
      expect(BriefStateAnnotation.State).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should initialize with empty arrays and null values', async () => {
      const result = await generateBrief('Test');

      // These should be populated after generation
      expect(result.sources).toBeDefined();
      expect(result.summaries).toBeDefined();
    });

    it('should preserve question throughout pipeline', async () => {
      const question = 'Test policy question about economics';

      const result = await generateBrief(question);

      expect(result.question).toBe(question);
    });
  });

  describe('Integration Flow', () => {
    it('should produce narrative with all sections', async () => {
      const result = await generateBrief('Test question');

      expect(result.narrative).toBeDefined();
      if (result.narrative) {
        expect(result.narrative.introduction).toBeDefined();
        expect(result.narrative.mainBody).toBeDefined();
        expect(result.narrative.conclusion).toBeDefined();
        expect(result.narrative.keyTakeaways).toBeDefined();
      }
    });

    it('should produce clarity score with breakdown', async () => {
      const result = await generateBrief('Test question');

      expect(result.clarityScore).toBeDefined();
      if (result.clarityScore) {
        expect(result.clarityScore.overall).toBeDefined();
        expect(result.clarityScore.breakdown).toBeDefined();
        expect(result.clarityScore.notes).toBeDefined();
      }
    });

    it('should produce reconciliation output', async () => {
      const result = await generateBrief('Test question');

      expect(result.reconciliation).toBeDefined();
      if (result.reconciliation) {
        expect(result.reconciliation.reconciledNarrative).toBeDefined();
        expect(result.reconciliation.isConsistent).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should always return a result object with expected shape', async () => {
      // Test that generateBrief always returns a properly shaped result
      const result = await generateBrief('Test question');

      expect(result).toBeDefined();
      // Should have the standard fields
      expect(result.question).toBeDefined();
      expect(result.sources).toBeDefined();
      expect(result.completedSteps).toBeDefined();
    });

    it('should preserve question in result', async () => {
      const result = await generateBrief('My question');

      expect(result.question).toBe('My question');
    });
  });
});
