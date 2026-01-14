/**
 * useInvestigationGeneration Hook Unit Tests
 *
 * Tests for the SSE-based accountability investigation generation hook.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { useInvestigationGeneration } from '@/lib/hooks/useInvestigationGeneration';

describe('useInvestigationGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Initial State', () => {
    it('should return initial state values', () => {
      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.currentStage).toBe('');
      expect(result.current.investigationId).toBeNull();
      expect(result.current.qualityScore).toBeNull();
      expect(result.current.creditRefunded).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should have 5 pending agent statuses initially', () => {
      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      expect(result.current.agentStatuses).toHaveLength(5);
      expect(result.current.agentStatuses.map((a) => a.name)).toEqual([
        'entity_classification',
        'uk_profile_research',
        'corruption_analysis',
        'action_list_generation',
        'quality_check',
      ]);
      expect(result.current.agentStatuses.every((a) => a.status === 'pending')).toBe(true);
    });

    it('should provide startGeneration function', () => {
      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      expect(typeof result.current.startGeneration).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('startGeneration', () => {
    it('should not start if targetEntity is empty', async () => {
      const { result } = renderHook(() =>
        useInvestigationGeneration('', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });

    it('should not start if ethics not acknowledged', async () => {
      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', false)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });

    it('should set status to generating when started', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      act(() => {
        result.current.startGeneration();
      });

      expect(result.current.status).toBe('generating');
    });

    it('should send correct POST request', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() =>
        useInvestigationGeneration('  Test Entity  ', true)
      );

      act(() => {
        result.current.startGeneration();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/accountability/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEntity: 'Test Entity',
          ethicsAcknowledged: true,
        }),
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ error: 'Server error' })),
      });

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('Server error');
        expect(result.current.creditRefunded).toBe(true);
      });
    });

    it('should set creditRefunded false for 402 responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 402,
        text: () => Promise.resolve(JSON.stringify({ error: 'Insufficient credits' })),
      });

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.creditRefunded).toBe(false);
      });
    });

    it('should handle no response body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      });

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('No response body');
      });
    });
  });

  describe('SSE Event Handling', () => {
    function createMockSSEStream(events: Array<{ event: string; data: Record<string, unknown> }>) {
      const lines = events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n`).join('\n');
      let index = 0;

      return {
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (index === 0) {
                index++;
                return { done: false, value: new TextEncoder().encode(lines) };
              }
              return { done: true, value: undefined };
            },
          }),
        },
      };
    }

    it('should update agent status on agent_started event', async () => {
      mockFetch.mockResolvedValue(
        createMockSSEStream([
          { event: 'agent_started', data: { agent: 'entity_classification' } },
        ])
      );

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        const agent = result.current.agentStatuses.find(
          (a) => a.name === 'entity_classification'
        );
        expect(agent?.status).toBe('running');
        expect(agent?.startedAt).toBeDefined();
      });
    });

    it('should update currentStage on agent_started event', async () => {
      mockFetch.mockResolvedValue(
        createMockSSEStream([
          { event: 'agent_started', data: { agent: 'uk_profile_research' } },
        ])
      );

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.currentStage).toBe('uk_profile_research');
      });
    });

    it('should update agent status on agent_completed event', async () => {
      mockFetch.mockResolvedValue(
        createMockSSEStream([
          { event: 'agent_started', data: { agent: 'entity_classification' } },
          { event: 'agent_completed', data: { agent: 'entity_classification', duration: 1500 } },
        ])
      );

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        const agent = result.current.agentStatuses.find(
          (a) => a.name === 'entity_classification'
        );
        expect(agent?.status).toBe('completed');
        expect(agent?.durationMs).toBe(1500);
        expect(agent?.completedAt).toBeDefined();
      });
    });

    it('should update progress based on completed agents', async () => {
      mockFetch.mockResolvedValue(
        createMockSSEStream([
          { event: 'agent_completed', data: { agent: 'entity_classification', duration: 100 } },
          { event: 'agent_completed', data: { agent: 'uk_profile_research', duration: 200 } },
        ])
      );

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.progress).toBe(40);
      });
    });

    it('should cap progress at 95% before completion', async () => {
      mockFetch.mockResolvedValue(
        createMockSSEStream([
          { event: 'agent_completed', data: { agent: 'entity_classification' } },
          { event: 'agent_completed', data: { agent: 'uk_profile_research' } },
          { event: 'agent_completed', data: { agent: 'corruption_analysis' } },
          { event: 'agent_completed', data: { agent: 'action_list_generation' } },
          { event: 'agent_completed', data: { agent: 'quality_check' } },
        ])
      );

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.progress).toBeLessThanOrEqual(95);
      });
    });

    it('should update currentStage on stage_changed event', async () => {
      mockFetch.mockResolvedValue(
        createMockSSEStream([
          { event: 'stage_changed', data: { stage: 'finalizing' } },
        ])
      );

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.currentStage).toBe('finalizing');
      });
    });

    it('should handle complete event successfully', async () => {
      mockFetch.mockResolvedValue(
        createMockSSEStream([
          {
            event: 'complete',
            data: {
              investigationId: 'inv-123',
              qualityScore: 85,
              creditRefunded: false,
            },
          },
        ])
      );

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('complete');
        expect(result.current.progress).toBe(100);
        expect(result.current.investigationId).toBe('inv-123');
        expect(result.current.qualityScore).toBe(85);
        expect(result.current.creditRefunded).toBe(false);
      });
    });

    it('should handle complete event with quality_failed status', async () => {
      mockFetch.mockResolvedValue(
        createMockSSEStream([
          {
            event: 'complete',
            data: {
              investigationId: 'inv-456',
              qualityScore: 45,
              creditRefunded: true,
            },
          },
        ])
      );

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('quality_failed');
        expect(result.current.creditRefunded).toBe(true);
      });
    });

    it('should handle error event', async () => {
      mockFetch.mockResolvedValue(
        createMockSSEStream([
          {
            event: 'error',
            data: { message: 'Generation failed', creditRefunded: true },
          },
        ])
      );

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('Generation failed');
        expect(result.current.creditRefunded).toBe(true);
      });
    });

    it('should handle malformed SSE data gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('event: agent_started\ndata: not-valid-json\n'),
              })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      });

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SSE] Failed to parse event:'),
        expect.anything()
      );

      consoleSpy.mockRestore();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => ({ done: true }),
          }),
        },
      });

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.currentStage).toBe('');
      expect(result.current.investigationId).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.agentStatuses.every((a) => a.status === 'pending')).toBe(true);
    });

    it('should abort ongoing request', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      act(() => {
        result.current.startGeneration();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
    });
  });

  describe('Cleanup', () => {
    it('should abort on unmount', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result, unmount } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      act(() => {
        result.current.startGeneration();
      });

      unmount();
    });

    it('should ignore AbortError on abort', async () => {
      mockFetch.mockImplementation((_url, options) => {
        return new Promise((_, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        });
      });

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      act(() => {
        result.current.startGeneration();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Network Errors', () => {
    it('should handle fetch network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should handle unknown error type', async () => {
      mockFetch.mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      await act(async () => {
        result.current.startGeneration();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('Unknown error');
      });
    });
  });

  describe('Abort Previous Request', () => {
    it('should abort previous request when starting new generation', async () => {
      let abortSignal: AbortSignal | null = null;
      mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
        abortSignal = options?.signal ?? null;
        return new Promise(() => {});
      });

      const { result } = renderHook(() =>
        useInvestigationGeneration('Test Entity', true)
      );

      act(() => {
        result.current.startGeneration();
      });

      const firstSignal = abortSignal as AbortSignal | null;

      act(() => {
        result.current.startGeneration();
      });

      expect(firstSignal?.aborted).toBe(true);
    });
  });
});
