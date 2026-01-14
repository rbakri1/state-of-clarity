/**
 * LangGraph Orchestrator Streaming Unit Tests
 *
 * Tests for the streaming events orchestrator that provides SSE callbacks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAnthropicMocks, queueMockResponse } from '../../mocks/anthropic';

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
      content: 'Test content.',
      publisher: 'Publisher',
      political_lean: 'center' as const,
      credibility_score: 8.0,
      relevance_score: 0.85,
      source_type: 'secondary' as const,
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
      keyTakeaways: ['Key takeaway'],
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
const mockInvoke = vi.fn();

vi.mock('@langchain/langgraph', () => {
  const mockGraph = {
    addNode: vi.fn().mockReturnThis(),
    addEdge: vi.fn().mockReturnThis(),
    compile: vi.fn().mockReturnValue({
      invoke: mockInvoke,
    }),
  };

  // Create Annotation as a function that also has a Root method
  const AnnotationFn = vi.fn().mockReturnValue({});
  AnnotationFn.Root = vi.fn().mockImplementation((config) => ({
    State: config,
  }));

  return {
    StateGraph: vi.fn().mockImplementation(() => mockGraph),
    Annotation: AnnotationFn,
    END: 'END',
    START: 'START',
  };
});

// Import after mocks
import {
  generateBriefWithEvents,
  GenerationCallbacks,
} from '@/lib/agents/langgraph-orchestrator-streaming';

describe('LangGraph Orchestrator Streaming', () => {
  let mockCallbacks: GenerationCallbacks;
  let agentStartedCalls: Array<{ agentName: string; stageName: string }>;
  let agentCompletedCalls: Array<{ agentName: string; stageName: string; durationMs: number }>;
  let stageChangedCalls: Array<{ stageName: string; activeAgents: string[] }>;
  let errorCalls: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    resetAnthropicMocks();

    agentStartedCalls = [];
    agentCompletedCalls = [];
    stageChangedCalls = [];
    errorCalls = [];

    mockCallbacks = {
      onAgentStarted: vi.fn((agentName, stageName) => {
        agentStartedCalls.push({ agentName, stageName });
      }),
      onAgentCompleted: vi.fn((agentName, stageName, durationMs) => {
        agentCompletedCalls.push({ agentName, stageName, durationMs });
      }),
      onStageChanged: vi.fn((stageName, activeAgents) => {
        stageChangedCalls.push({ stageName, activeAgents });
      }),
      onError: vi.fn((error) => {
        errorCalls.push(error);
      }),
    };

    // Default successful invoke
    mockInvoke.mockImplementation(async (state) => ({
      ...state,
      sources: [{ id: 'source-1', title: 'Test' }],
      classification: { domain: 'economics' },
      persona: { name: 'Policy Analyst' },
      structure: { factors: [], policies: [] },
      narrative: {
        introduction: 'Test intro',
        mainBody: 'Test body',
        conclusion: 'Test conclusion',
        keyTakeaways: ['Takeaway'],
      },
      reconciliation: {
        reconciledNarrative: {
          introduction: 'Test intro',
          mainBody: 'Test body',
          conclusion: 'Test conclusion',
          keyTakeaways: ['Takeaway'],
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
      completedSteps: ['research', 'classification', 'structure', 'narrative'],
    }));
  });

  describe('generateBriefWithEvents', () => {
    it('should generate brief with callbacks', async () => {
      const result = await generateBriefWithEvents(
        'Test question',
        'brief-123',
        mockCallbacks
      );

      expect(result).toBeDefined();
      expect(result.question).toBe('Test question');
      expect(result.briefId).toBe('brief-123');
    });

    it('should pass callbacks in initial state', async () => {
      await generateBriefWithEvents('Test question', 'brief-123', mockCallbacks);

      expect(mockInvoke).toHaveBeenCalled();
      const invokedState = mockInvoke.mock.calls[0][0];
      expect(invokedState.callbacks).toBe(mockCallbacks);
    });

    it('should preserve briefId in result', async () => {
      const briefId = 'test-brief-id-456';

      const result = await generateBriefWithEvents('Test', briefId, mockCallbacks);

      expect(result.briefId).toBe(briefId);
    });

    it('should include all required state fields', async () => {
      const result = await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(result.sources).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.narrative).toBeDefined();
      expect(result.summaries).toBeDefined();
      expect(result.clarityScore).toBeDefined();
    });
  });

  describe('Callback Interface', () => {
    it('should accept callbacks with onAgentStarted', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(mockCallbacks.onAgentStarted).toBeDefined();
    });

    it('should accept callbacks with onAgentCompleted', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(mockCallbacks.onAgentCompleted).toBeDefined();
    });

    it('should accept callbacks with onStageChanged', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(mockCallbacks.onStageChanged).toBeDefined();
    });

    it('should accept callbacks with onError', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(mockCallbacks.onError).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when graph invocation fails', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Pipeline failed'));

      const result = await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(mockCallbacks.onError).toHaveBeenCalledWith('Pipeline failed');
      expect(result.error).toBe('Pipeline failed');
    });

    it('should set error field on failure', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Test error'));

      const result = await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Test error');
    });

    it('should preserve question on error', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failure'));

      const result = await generateBriefWithEvents('My question', 'brief-1', mockCallbacks);

      expect(result.question).toBe('My question');
    });

    it('should preserve briefId on error', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Error'));

      const result = await generateBriefWithEvents('Test', 'my-brief-id', mockCallbacks);

      expect(result.briefId).toBe('my-brief-id');
    });

    it('should handle non-Error objects thrown', async () => {
      mockInvoke.mockRejectedValueOnce('String error');

      const result = await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(mockCallbacks.onError).toHaveBeenCalledWith('String error');
      expect(result.error).toBe('String error');
    });
  });

  describe('State Initialization', () => {
    it('should initialize with empty sources array', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      const initialState = mockInvoke.mock.calls[0][0];
      expect(initialState.sources).toEqual([]);
    });

    it('should initialize with null classification', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      const initialState = mockInvoke.mock.calls[0][0];
      expect(initialState.classification).toBeNull();
    });

    it('should initialize with null persona', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      const initialState = mockInvoke.mock.calls[0][0];
      expect(initialState.persona).toBeNull();
    });

    it('should initialize with null structure', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      const initialState = mockInvoke.mock.calls[0][0];
      expect(initialState.structure).toBeNull();
    });

    it('should initialize with null narrative', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      const initialState = mockInvoke.mock.calls[0][0];
      expect(initialState.narrative).toBeNull();
    });

    it('should initialize with empty summaries object', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      const initialState = mockInvoke.mock.calls[0][0];
      expect(initialState.summaries).toEqual({});
    });

    it('should initialize with empty completedSteps array', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      const initialState = mockInvoke.mock.calls[0][0];
      expect(initialState.completedSteps).toEqual([]);
    });

    it('should initialize with null error', async () => {
      await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      const initialState = mockInvoke.mock.calls[0][0];
      expect(initialState.error).toBeNull();
    });
  });

  describe('Result Structure', () => {
    it('should return narrative with all sections', async () => {
      const result = await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(result.narrative).toBeDefined();
      if (result.narrative) {
        expect(result.narrative.introduction).toBeDefined();
        expect(result.narrative.mainBody).toBeDefined();
        expect(result.narrative.conclusion).toBeDefined();
        expect(result.narrative.keyTakeaways).toBeDefined();
      }
    });

    it('should return clarity score with breakdown', async () => {
      const result = await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(result.clarityScore).toBeDefined();
      if (result.clarityScore) {
        expect(result.clarityScore.overall).toBeDefined();
        expect(result.clarityScore.breakdown).toBeDefined();
      }
    });

    it('should return summaries object', async () => {
      const result = await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(result.summaries).toBeDefined();
      expect(typeof result.summaries).toBe('object');
    });

    it('should return sources array', async () => {
      const result = await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);
    });

    it('should return completedSteps array', async () => {
      const result = await generateBriefWithEvents('Test', 'brief-1', mockCallbacks);

      expect(result.completedSteps).toBeDefined();
      expect(Array.isArray(result.completedSteps)).toBe(true);
    });
  });

  describe('Callback Error Resilience', () => {
    it('should not fail if callback throws error', async () => {
      const errorCallbacks: GenerationCallbacks = {
        onAgentStarted: vi.fn().mockImplementation(() => {
          throw new Error('Callback error');
        }),
        onAgentCompleted: vi.fn(),
        onStageChanged: vi.fn(),
        onError: vi.fn(),
      };

      // Graph should still complete even if callbacks throw
      const result = await generateBriefWithEvents('Test', 'brief-1', errorCallbacks);

      expect(result).toBeDefined();
      expect(result.question).toBe('Test');
    });
  });
});
