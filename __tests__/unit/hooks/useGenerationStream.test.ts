/**
 * useGenerationStream Hook Unit Tests
 *
 * Tests for the SSE-based brief generation stream hook.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { GenerationEvent } from '@/lib/types/generation-events';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { useGenerationStream } from '@/lib/hooks/useGenerationStream';

describe('useGenerationStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Initial State', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useGenerationStream());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.currentStage).toBe('initializing');
      expect(result.current.agentStatuses).toEqual([]);
      expect(result.current.briefId).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isComplete).toBe(false);
    });

    it('should provide startGeneration function', () => {
      const { result } = renderHook(() => useGenerationStream());

      expect(typeof result.current.startGeneration).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useGenerationStream());

      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('startGeneration', () => {
    it('should set isGenerating to true when started', async () => {
      mockFetch.mockImplementation(() =>
        new Promise(() => {}) // Never resolves, simulates streaming
      );

      const { result } = renderHook(() => useGenerationStream());

      act(() => {
        result.current.startGeneration('What is inflation?');
      });

      expect(result.current.isGenerating).toBe(true);
    });

    it('should reset state when starting new generation', async () => {
      mockFetch.mockImplementation(() =>
        new Promise(() => {})
      );

      const { result } = renderHook(() => useGenerationStream());

      // Simulate previous state
      act(() => {
        result.current.startGeneration('First question');
      });

      // Start new generation
      act(() => {
        result.current.startGeneration('Second question');
      });

      expect(result.current.agentStatuses).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.isComplete).toBe(false);
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test question');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Server error');
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('should extract briefId from response headers', async () => {
      const mockHeaders = new Map([['X-Brief-Id', 'brief-123']]);
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => mockHeaders.get(name) || null,
        },
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"stage_changed","stageName":"researching"}\n') })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      });

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test question');
      });

      await waitFor(() => {
        expect(result.current.briefId).toBe('brief-123');
      });
    });
  });

  describe('Event Handling', () => {
    function createMockStream(events: GenerationEvent[]) {
      const lines = events.map(e => `data: ${JSON.stringify(e)}\n`).join('');
      let index = 0;

      return {
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => ({
            read: async () => {
              if (index === 0) {
                index++;
                return { done: false, value: new TextEncoder().encode(lines) };
              }
              return { done: true };
            },
          }),
        },
      };
    }

    it('should handle agent_started event', async () => {
      mockFetch.mockResolvedValue(createMockStream([
        { type: 'agent_started', agentName: 'ResearchAgent' },
      ]));

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        const agent = result.current.agentStatuses.find(a => a.name === 'ResearchAgent');
        expect(agent).toBeDefined();
        expect(agent?.status).toBe('running');
      });
    });

    it('should handle agent_completed event', async () => {
      mockFetch.mockResolvedValue(createMockStream([
        { type: 'agent_started', agentName: 'ResearchAgent' },
        { type: 'agent_completed', agentName: 'ResearchAgent', metadata: { durationMs: 1500 } },
      ]));

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        const agent = result.current.agentStatuses.find(a => a.name === 'ResearchAgent');
        expect(agent?.status).toBe('completed');
        expect(agent?.durationMs).toBe(1500);
      });
    });

    it('should handle stage_changed event', async () => {
      mockFetch.mockResolvedValue(createMockStream([
        { type: 'stage_changed', stageName: 'generating_narrative' },
      ]));

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        expect(result.current.currentStage).toBe('generating_narrative');
      });
    });

    it('should handle brief_ready event', async () => {
      mockFetch.mockResolvedValue(createMockStream([
        { type: 'brief_ready', metadata: { briefId: 'brief-456' } },
      ]));

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.isGenerating).toBe(false);
        expect(result.current.currentStage).toBe('complete');
        expect(result.current.briefId).toBe('brief-456');
      });
    });

    it('should handle error event', async () => {
      mockFetch.mockResolvedValue(createMockStream([
        { type: 'agent_started', agentName: 'ResearchAgent' },
        { type: 'error', agentName: 'ResearchAgent', metadata: { error: 'Research failed' } },
      ]));

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Research failed');
        expect(result.current.isGenerating).toBe(false);
        const agent = result.current.agentStatuses.find(a => a.name === 'ResearchAgent');
        expect(agent?.status).toBe('failed');
      });
    });

    it('should handle stage_changed with briefId in metadata', async () => {
      mockFetch.mockResolvedValue(createMockStream([
        { type: 'stage_changed', stageName: 'researching', metadata: { briefId: 'new-brief' } },
      ]));

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        expect(result.current.briefId).toBe('new-brief');
      });
    });

    it('should update stage on agent_started with stageName', async () => {
      mockFetch.mockResolvedValue(createMockStream([
        { type: 'agent_started', agentName: 'NarrativeAgent', stageName: 'narrative' },
      ]));

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        expect(result.current.currentStage).toBe('narrative');
      });
    });
  });

  describe('reset', () => {
    it('should reset to initial state', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'brief-123' },
        body: {
          getReader: () => ({
            read: async () => ({ done: true }),
          }),
        },
      });

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.currentStage).toBe('initializing');
      expect(result.current.agentStatuses).toEqual([]);
      expect(result.current.briefId).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isComplete).toBe(false);
    });

    it('should abort ongoing request', async () => {
      mockFetch.mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useGenerationStream());

      act(() => {
        result.current.startGeneration('Test');
      });

      act(() => {
        result.current.reset();
      });

      // Should not throw and should reset state
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('Agent Status Updates', () => {
    it('should add new agent to statuses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"agent_started","agentName":"Agent1"}\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"agent_started","agentName":"Agent2"}\n'),
              })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      });

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        expect(result.current.agentStatuses.length).toBe(2);
      });
    });

    it('should update existing agent status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"agent_started","agentName":"Agent1"}\ndata: {"type":"agent_completed","agentName":"Agent1"}\n'),
              })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      });

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        expect(result.current.agentStatuses.length).toBe(1);
        expect(result.current.agentStatuses[0].status).toBe('completed');
      });
    });
  });

  describe('Cleanup', () => {
    it('should abort on unmount', () => {
      mockFetch.mockImplementation(() =>
        new Promise(() => {})
      );

      const { result, unmount } = renderHook(() => useGenerationStream());

      act(() => {
        result.current.startGeneration('Test');
      });

      // Should not throw on unmount
      unmount();
    });
  });

  describe('Error Cases', () => {
    it('should handle no response body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        body: null,
      });

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('No response body');
      });
    });

    it('should handle malformed SSE data', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: not-valid-json\n'),
              })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      });

      const { result } = renderHook(() => useGenerationStream());

      await act(async () => {
        result.current.startGeneration('Test');
      });

      // Should not crash, just warn
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SSE] Failed to parse event:'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it('should ignore AbortError', async () => {
      mockFetch.mockImplementation((_url, options) => {
        return new Promise((_, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        });
      });

      const { result } = renderHook(() => useGenerationStream());

      act(() => {
        result.current.startGeneration('Test');
      });

      act(() => {
        result.current.reset(); // Triggers abort
      });

      // Should not set error for AbortError
      expect(result.current.error).toBeNull();
    });
  });
});
