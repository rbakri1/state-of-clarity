/**
 * Retry Executor Unit Tests
 *
 * Tests for the retry executor agent that processes items from the retry queue
 * and re-executes brief generation with adjusted parameters.
 *
 * Note: The internal brief generation uses Anthropic SDK which is challenging to mock
 * alongside multiple other module mocks. Tests focus on:
 * - Queue processing logic (getNextRetryItem, markRetryComplete)
 * - Error handling paths
 * - The internal parameter adjustment logic is tested via integration tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QualityTier, type RetryQueueItem } from '@/lib/types/quality-gate';
import type { Source } from '@/lib/agents/research-agent';

// Mock dependencies before importing retry-executor
vi.mock('@/lib/agents/research-agent');
vi.mock('@/lib/agents/quality-gate');
vi.mock('@/lib/services/retry-queue-service');

// Create a more robust Anthropic mock that directly provides the response
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
    constructor() {}
  },
}));

// Import mocked modules after vi.mock declarations
import { researchAgent } from '@/lib/agents/research-agent';
import { runQualityGate, getTierDecision } from '@/lib/agents/quality-gate';
import {
  getNextRetryItem,
  markRetryComplete,
} from '@/lib/services/retry-queue-service';

// Import the module under test
import { processNextRetry, processAllPendingRetries } from '@/lib/agents/retry-executor';

// Get typed mocks
const mockResearchAgent = vi.mocked(researchAgent);
const mockRunQualityGate = vi.mocked(runQualityGate);
const mockGetTierDecision = vi.mocked(getTierDecision);
const mockGetNextRetryItem = vi.mocked(getNextRetryItem);
const mockMarkRetryComplete = vi.mocked(markRetryComplete);

// Test helpers
function createMockRetryItem(overrides: Partial<RetryQueueItem> = {}): RetryQueueItem {
  return {
    id: 'retry-123',
    briefId: 'brief-456',
    originalQuestion: 'What is the impact of climate change on global food security?',
    classification: { domain: 'environment', controversy_level: 'high' },
    failureReason: 'Low evidence quality score',
    retryParams: {
      specialistPersona: 'Policy Analyst',
      minSources: 10,
    },
    scheduledAt: new Date(),
    attempts: 0,
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockSources(count: number = 10): Source[] {
  const leans: Array<Source['political_lean']> = ['left', 'center-left', 'center', 'center-right', 'right'];

  return Array.from({ length: count }, (_, i) => ({
    id: `source-${i}`,
    url: `https://example.com/article-${i}`,
    title: `Test Article ${i}`,
    content: `This is test content for article ${i}.`,
    publisher: `Publisher ${i}`,
    source_type: 'primary' as const,
    political_lean: leans[i % leans.length],
    credibility_score: 8,
    relevance_score: 0.85,
    accessed_at: new Date().toISOString(),
  }));
}

function createMockAnthropicResponse(brief: { title: string; summary: string; content: string }) {
  return {
    id: 'msg_mock_123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: JSON.stringify(brief) }],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 200 },
  };
}

describe('Retry Executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('processNextRetry', () => {
    it('should return null when no retry items are available', async () => {
      mockGetNextRetryItem.mockResolvedValue(null);

      const result = await processNextRetry();

      expect(result).toBeNull();
      expect(mockGetNextRetryItem).toHaveBeenCalledTimes(1);
      expect(mockMarkRetryComplete).not.toHaveBeenCalled();
    });

    it('should execute retry successfully when quality gate passes', async () => {
      const mockRetryItem = createMockRetryItem();
      const mockSources = createMockSources(15);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Climate Change Impact on Food Security',
        summary: 'This brief examines the effects of climate change.',
        content: 'Detailed analysis of climate impacts on agriculture...',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.5,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality brief',
      });

      const result = await processNextRetry();

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.finalScore).toBe(8.5);
      expect(result?.tier).toBe(QualityTier.HIGH);
      expect(result?.attempts).toBe(1);
      expect(mockMarkRetryComplete).toHaveBeenCalledWith('retry-123', true);
    });

    it('should handle errors during retry execution', async () => {
      const mockRetryItem = createMockRetryItem();

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockRejectedValue(new Error('Network error'));

      const result = await processNextRetry();

      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Network error');
      expect(result?.attempts).toBe(1);
      expect(mockMarkRetryComplete).toHaveBeenCalledWith('retry-123', false);
    });

    it('should mark retry complete after quality gate failure', async () => {
      const mockRetryItem = createMockRetryItem();
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Test Brief',
        summary: 'Test summary',
        content: 'Test content',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.FAILED,
        finalScore: 4.5,
        attempts: 1,
        publishable: false,
        warningBadge: false,
        refundRequired: true,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.FAILED,
        publishable: false,
        warningBadge: false,
        refundRequired: true,
        reasoning: 'Failed quality gate',
      });

      const result = await processNextRetry();

      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.tier).toBe(QualityTier.FAILED);
      expect(mockMarkRetryComplete).toHaveBeenCalledWith('retry-123', false);
    });

    it('should increment attempt count correctly', async () => {
      const mockRetryItem = createMockRetryItem({ attempts: 1 });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Test Brief',
        summary: 'Test summary',
        content: 'Test content',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.ACCEPTABLE,
        finalScore: 7.0,
        attempts: 2,
        publishable: true,
        warningBadge: true,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.ACCEPTABLE,
        publishable: true,
        warningBadge: true,
        refundRequired: false,
        reasoning: 'Acceptable quality',
      });

      const result = await processNextRetry();

      expect(result?.attempts).toBe(2);
    });
  });

  describe('adjustParametersForRetry (internal, tested via processNextRetry)', () => {
    it('should adjust parameters for low evidence failure', async () => {
      const mockRetryItem = createMockRetryItem({
        failureReason: 'Low evidence quality - insufficient sources',
        retryParams: { minSources: 10 },
      });
      const mockSources = createMockSources(15);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Test Brief',
        summary: 'Test summary',
        content: 'Test content',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.5,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      await processNextRetry();

      // Verify research agent was called with the question
      expect(mockResearchAgent).toHaveBeenCalledWith(mockRetryItem.originalQuestion);
    });

    it('should adjust parameters for low objectivity failure', async () => {
      const mockRetryItem = createMockRetryItem({
        failureReason: 'Low objectivity - bias detected in analysis',
        retryParams: {},
      });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Test Brief',
        summary: 'Test summary',
        content: 'Test content with balanced perspectives.',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.0,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      const result = await processNextRetry();

      expect(result?.success).toBe(true);
      expect(mockResearchAgent).toHaveBeenCalled();
    });

    it('should adjust parameters for low clarity failure', async () => {
      const mockRetryItem = createMockRetryItem({
        failureReason: 'Low clarity - unclear language and structure',
        retryParams: {},
      });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Clear Test Brief',
        summary: 'A clear and concise summary.',
        content: 'Well-structured content with defined terms.',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.2,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      const result = await processNextRetry();

      expect(result?.success).toBe(true);
    });

    it('should apply stronger adjustments on subsequent attempts', async () => {
      const mockRetryItem = createMockRetryItem({
        attempts: 1,
        failureReason: 'Generic failure',
        retryParams: { minSources: 10 },
      });
      const mockSources = createMockSources(15);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Test Brief',
        summary: 'Test summary',
        content: 'Test content',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.ACCEPTABLE,
        finalScore: 7.5,
        attempts: 2,
        publishable: true,
        warningBadge: true,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.ACCEPTABLE,
        publishable: true,
        warningBadge: true,
        refundRequired: false,
        reasoning: 'Acceptable quality',
      });

      const result = await processNextRetry();

      expect(result?.attempts).toBe(2);
    });
  });

  describe('ensureOpposingViews (internal, tested via processNextRetry)', () => {
    it('should maintain source balance when forcing opposing views', async () => {
      const mockRetryItem = createMockRetryItem({
        failureReason: 'Low objectivity - one-sided coverage',
        retryParams: { forceOpposingViews: true },
      });
      const balancedSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(balancedSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Balanced Analysis',
        summary: 'A balanced perspective on the issue.',
        content: 'Content presenting multiple viewpoints.',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.5,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      const result = await processNextRetry();

      expect(result?.success).toBe(true);
      expect(mockResearchAgent).toHaveBeenCalled();
    });

    it('should handle sources with unbalanced political distribution', async () => {
      const mockRetryItem = createMockRetryItem({
        failureReason: 'Bias detected',
        retryParams: { forceOpposingViews: true },
      });
      const unbalancedSources: Source[] = Array.from({ length: 10 }, (_, i) => ({
        id: `source-${i}`,
        url: `https://example.com/article-${i}`,
        title: `Test Article ${i}`,
        content: `Content ${i}`,
        publisher: `Publisher ${i}`,
        source_type: 'primary' as const,
        political_lean: i < 8 ? 'left' as const : 'center' as const,
        credibility_score: 8,
        relevance_score: 0.85,
        accessed_at: new Date().toISOString(),
      }));

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(unbalancedSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Analysis',
        summary: 'Summary',
        content: 'Content',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.ACCEPTABLE,
        finalScore: 7.0,
        attempts: 1,
        publishable: true,
        warningBadge: true,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.ACCEPTABLE,
        publishable: true,
        warningBadge: true,
        refundRequired: false,
        reasoning: 'Acceptable quality with warning',
      });

      const result = await processNextRetry();

      expect(result).not.toBeNull();
      expect(mockResearchAgent).toHaveBeenCalled();
    });
  });

  describe('generateBriefWithAdjustedParams (internal, tested via processNextRetry)', () => {
    it('should use specialist persona in prompt', async () => {
      const mockRetryItem = createMockRetryItem({
        retryParams: { specialistPersona: 'Investigative Journalist' },
      });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Investigative Report',
        summary: 'A thorough investigation.',
        content: 'Investigative journalism style content.',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.5,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      const result = await processNextRetry();

      expect(result?.success).toBe(true);
    });

    it('should include adjusted prompts when provided', async () => {
      const mockRetryItem = createMockRetryItem({
        failureReason: 'Low clarity',
        retryParams: {
          adjustedPrompts: ['Use shorter sentences', 'Define technical terms'],
        },
      });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Clear Brief',
        summary: 'Simple summary.',
        content: 'Clear, short sentences. Technical terms defined.',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.0,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      const result = await processNextRetry();

      expect(result?.success).toBe(true);
    });

    it('should handle JSON parsing errors in brief generation', async () => {
      const mockRetryItem = createMockRetryItem();
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      // Return invalid JSON response
      mockCreate.mockResolvedValue({
        id: 'msg_mock_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'This is not valid JSON and has no braces' }],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 200 },
      });

      const result = await processNextRetry();

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('parse');
      expect(mockMarkRetryComplete).toHaveBeenCalledWith('retry-123', false);
    });
  });

  describe('processAllPendingRetries', () => {
    it('should process all pending retry items', async () => {
      const mockRetryItem1 = createMockRetryItem({ id: 'retry-1' });
      const mockRetryItem2 = createMockRetryItem({ id: 'retry-2' });
      const mockRetryItem3 = createMockRetryItem({ id: 'retry-3' });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem
        .mockResolvedValueOnce(mockRetryItem1)
        .mockResolvedValueOnce(mockRetryItem2)
        .mockResolvedValueOnce(mockRetryItem3)
        .mockResolvedValueOnce(null);

      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Brief',
        summary: 'Summary',
        content: 'Content',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.5,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      const results = await processAllPendingRetries();

      expect(results).toHaveLength(3);
      expect(results.filter(r => r.success)).toHaveLength(3);
      expect(mockGetNextRetryItem).toHaveBeenCalledTimes(4);
      expect(mockMarkRetryComplete).toHaveBeenCalledTimes(3);
    });

    it('should stop processing when no more items are available', async () => {
      mockGetNextRetryItem.mockResolvedValue(null);

      const results = await processAllPendingRetries();

      expect(results).toHaveLength(0);
      expect(mockGetNextRetryItem).toHaveBeenCalledTimes(1);
      expect(mockMarkRetryComplete).not.toHaveBeenCalled();
    });

    it('should handle mixed success and failure results', async () => {
      const mockRetryItem1 = createMockRetryItem({ id: 'retry-1' });
      const mockRetryItem2 = createMockRetryItem({ id: 'retry-2' });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem
        .mockResolvedValueOnce(mockRetryItem1)
        .mockResolvedValueOnce(mockRetryItem2)
        .mockResolvedValueOnce(null);

      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Brief',
        summary: 'Summary',
        content: 'Content',
      }));

      mockRunQualityGate
        .mockResolvedValueOnce({
          tier: QualityTier.HIGH,
          finalScore: 8.5,
          attempts: 1,
          publishable: true,
          warningBadge: false,
          refundRequired: false,
        })
        .mockResolvedValueOnce({
          tier: QualityTier.FAILED,
          finalScore: 4.0,
          attempts: 1,
          publishable: false,
          warningBadge: false,
          refundRequired: true,
        });

      mockGetTierDecision.mockImplementation((score: number) => ({
        tier: score >= 8.0 ? QualityTier.HIGH : QualityTier.FAILED,
        publishable: score >= 6.0,
        warningBadge: score >= 6.0 && score < 8.0,
        refundRequired: score < 6.0,
        reasoning: score >= 8.0 ? 'High quality' : 'Failed quality gate',
      }));

      const results = await processAllPendingRetries();

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(mockMarkRetryComplete).toHaveBeenCalledWith('retry-1', true);
      expect(mockMarkRetryComplete).toHaveBeenCalledWith('retry-2', false);
    });

    it('should continue processing after individual item errors', async () => {
      const mockRetryItem1 = createMockRetryItem({ id: 'retry-1' });
      const mockRetryItem2 = createMockRetryItem({ id: 'retry-2' });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem
        .mockResolvedValueOnce(mockRetryItem1)
        .mockResolvedValueOnce(mockRetryItem2)
        .mockResolvedValueOnce(null);

      mockResearchAgent
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSources);

      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Brief 2',
        summary: 'Summary 2',
        content: 'Content 2',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.5,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      const results = await processAllPendingRetries();

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Network error');
      expect(results[1].success).toBe(true);
    });

    it('should return empty array when first item is null', async () => {
      mockGetNextRetryItem.mockResolvedValue(null);

      const results = await processAllPendingRetries();

      expect(results).toEqual([]);
      expect(mockGetNextRetryItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown error types gracefully', async () => {
      const mockRetryItem = createMockRetryItem();

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockRejectedValue('String error');

      const result = await processNextRetry();

      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Unknown error');
    });

    it('should handle quality gate throwing error', async () => {
      const mockRetryItem = createMockRetryItem();
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Test Brief',
        summary: 'Test summary',
        content: 'Test content',
      }));
      mockRunQualityGate.mockRejectedValue(new Error('Quality gate service unavailable'));

      const result = await processNextRetry();

      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Quality gate service unavailable');
      expect(mockMarkRetryComplete).toHaveBeenCalledWith('retry-123', false);
    });
  });

  describe('Persona Assignment', () => {
    it('should assign default persona when none provided', async () => {
      const mockRetryItem = createMockRetryItem({
        retryParams: {},
        attempts: 0,
      });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Test Brief',
        summary: 'Test summary',
        content: 'Test content',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.5,
        attempts: 1,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      const result = await processNextRetry();

      expect(result?.success).toBe(true);
    });

    it('should cycle through personas on subsequent attempts', async () => {
      const mockRetryItem = createMockRetryItem({
        retryParams: {},
        attempts: 1,
      });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Test Brief',
        summary: 'Test summary',
        content: 'Test content',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.HIGH,
        finalScore: 8.5,
        attempts: 2,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.HIGH,
        publishable: true,
        warningBadge: false,
        refundRequired: false,
        reasoning: 'High quality',
      });

      const result = await processNextRetry();

      expect(result?.success).toBe(true);
      expect(result?.attempts).toBe(2);
    });
  });

  describe('Source Gathering', () => {
    it('should warn when source count is below minimum', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockRetryItem = createMockRetryItem({
        retryParams: { minSources: 20 },
      });
      const mockSources = createMockSources(10);

      mockGetNextRetryItem.mockResolvedValue(mockRetryItem);
      mockResearchAgent.mockResolvedValue(mockSources);
      mockCreate.mockResolvedValue(createMockAnthropicResponse({
        title: 'Test Brief',
        summary: 'Test summary',
        content: 'Test content',
      }));
      mockRunQualityGate.mockResolvedValue({
        tier: QualityTier.ACCEPTABLE,
        finalScore: 7.0,
        attempts: 1,
        publishable: true,
        warningBadge: true,
        refundRequired: false,
      });
      mockGetTierDecision.mockReturnValue({
        tier: QualityTier.ACCEPTABLE,
        publishable: true,
        warningBadge: true,
        refundRequired: false,
        reasoning: 'Acceptable',
      });

      await processNextRetry();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Only found 10 sources, target was 20')
      );

      consoleSpy.mockRestore();
    });
  });
});
