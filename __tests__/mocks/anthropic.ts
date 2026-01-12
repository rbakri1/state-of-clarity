/**
 * Anthropic Claude API Mock
 *
 * Provides mock responses for Claude API calls in tests.
 */

import { vi } from 'vitest';

// Mock response types
export interface MockMessageResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Default mock responses by pattern
const defaultResponses: Record<string, string> = {
  // Question classification
  classification: JSON.stringify({
    domain: 'economics',
    controversy_level: 'medium',
    question_type: 'analytical',
    temporal_scope: 'current',
  }),

  // Evaluator verdict
  evaluator: JSON.stringify({
    dimensions: {
      first_principles_coherence: { score: 8.0, critique: 'Well-structured argument' },
      internal_consistency: { score: 8.5, critique: 'No contradictions found' },
      evidence_quality: { score: 7.5, critique: 'Good source diversity' },
      accessibility: { score: 8.0, critique: 'Clear language' },
      objectivity: { score: 7.0, critique: 'Minor bias detected' },
      factual_accuracy: { score: 8.5, critique: 'Claims well-supported' },
      bias_detection: { score: 7.5, critique: 'Some framing bias' },
    },
    overall_score: 7.9,
    summary: 'A solid brief with room for improvement in objectivity.',
    top_issues: [
      { dimension: 'objectivity', severity: 'medium', description: 'Consider more perspectives' },
    ],
  }),

  // Structure generation
  structure: JSON.stringify({
    definitions: [
      { term: 'GDP', definition: 'Gross Domestic Product' },
    ],
    factors: [
      { name: 'Economic Growth', description: 'Key driver', evidence: 'Multiple studies' },
    ],
    policies: [
      { name: 'Monetary Policy', description: 'Central bank actions' },
    ],
  }),

  // Narrative generation
  narrative: JSON.stringify({
    introduction: 'This brief examines...',
    body: 'The evidence shows...',
    conclusion: 'In conclusion...',
  }),

  // Summary generation
  summary: 'This is a test summary of the brief content.',

  // Fixer suggestions
  fixer: JSON.stringify({
    edits: [
      { section: 'introduction', original: 'old text', suggested: 'new text', reason: 'clarity' },
    ],
  }),

  // Reconciliation
  reconciliation: JSON.stringify({
    reconciled_edits: [
      { section: 'body', final_text: 'Reconciled content' },
    ],
    conflicts_resolved: 1,
  }),

  // Tiebreaker
  tiebreaker: JSON.stringify({
    final_scores: {
      first_principles_coherence: 7.5,
      internal_consistency: 8.0,
      evidence_quality: 7.5,
      accessibility: 8.0,
      objectivity: 7.0,
      factual_accuracy: 8.0,
      bias_detection: 7.0,
    },
    reasoning: 'After careful consideration...',
    overall_score: 7.6,
  }),
};

// Response queue for custom responses
let responseQueue: string[] = [];

// Mock create function
const mockCreate = vi.fn().mockImplementation(async (params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  system?: string;
}) => {
  // Check for queued response
  if (responseQueue.length > 0) {
    const response = responseQueue.shift()!;
    return createMockResponse(response, params.model);
  }

  // Determine response based on system prompt or message content
  const systemPrompt = params.system?.toLowerCase() || '';
  const messageContent = params.messages.map(m => m.content).join(' ').toLowerCase();
  const combined = systemPrompt + ' ' + messageContent;

  let responseText: string;

  if (combined.includes('classif')) {
    responseText = defaultResponses.classification;
  } else if (combined.includes('evaluat') || combined.includes('score') || combined.includes('critic')) {
    responseText = defaultResponses.evaluator;
  } else if (combined.includes('structur')) {
    responseText = defaultResponses.structure;
  } else if (combined.includes('narrat')) {
    responseText = defaultResponses.narrative;
  } else if (combined.includes('summar')) {
    responseText = defaultResponses.summary;
  } else if (combined.includes('fix') || combined.includes('improve')) {
    responseText = defaultResponses.fixer;
  } else if (combined.includes('reconcil')) {
    responseText = defaultResponses.reconciliation;
  } else if (combined.includes('tiebreak') || combined.includes('arbiter')) {
    responseText = defaultResponses.tiebreaker;
  } else {
    responseText = 'Mock response for: ' + params.messages[params.messages.length - 1]?.content?.slice(0, 100);
  }

  return createMockResponse(responseText, params.model);
});

function createMockResponse(text: string, model: string): MockMessageResponse {
  return {
    id: `msg_mock_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text }],
    model,
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 100,
      output_tokens: 200,
    },
  };
}

// Mock Anthropic client
export const mockAnthropicClient = {
  messages: {
    create: mockCreate,
  },
};

// Mock Anthropic class
export class MockAnthropic {
  messages = mockAnthropicClient.messages;

  constructor(_options?: { apiKey?: string }) {
    // Accept options but ignore them in mock
  }
}

// Helper to queue specific responses
export function queueMockResponse(response: string) {
  responseQueue.push(response);
}

// Helper to queue multiple responses
export function queueMockResponses(responses: string[]) {
  responseQueue.push(...responses);
}

// Helper to clear response queue
export function clearMockResponses() {
  responseQueue = [];
}

// Helper to set default response for a type
export function setDefaultResponse(type: keyof typeof defaultResponses, response: string) {
  defaultResponses[type] = response;
}

// Helper to reset all mocks
export function resetAnthropicMocks() {
  mockCreate.mockClear();
  responseQueue = [];
}

// Export for vi.mock
export default MockAnthropic;
