/**
 * SSE Helpers Unit Tests
 *
 * Tests for Server-Sent Events (SSE) helper functions.
 * Tests createSSEResponse and sendSSE utilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSSEResponse, sendSSE } from '@/lib/api/sse-helpers';

describe('SSE Helpers', () => {
  describe('createSSEResponse', () => {
    it('should create a Response with the provided stream', () => {
      const mockStream = new ReadableStream();
      const response = createSSEResponse(mockStream);

      expect(response).toBeInstanceOf(Response);
      expect(response.body).toBe(mockStream);
    });

    it('should set Content-Type header to text/event-stream', () => {
      const mockStream = new ReadableStream();
      const response = createSSEResponse(mockStream);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('should set Cache-Control header to no-cache', () => {
      const mockStream = new ReadableStream();
      const response = createSSEResponse(mockStream);

      expect(response.headers.get('Cache-Control')).toBe('no-cache');
    });

    it('should set Connection header to keep-alive', () => {
      const mockStream = new ReadableStream();
      const response = createSSEResponse(mockStream);

      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('should work with an empty ReadableStream', () => {
      const emptyStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });
      const response = createSSEResponse(emptyStream);

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('should work with a stream that has data', async () => {
      const dataStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('test data'));
          controller.close();
        },
      });
      const response = createSSEResponse(dataStream);

      const reader = response.body!.getReader();
      const { value, done } = await reader.read();

      expect(done).toBe(false);
      expect(new TextDecoder().decode(value)).toBe('test data');
    });
  });

  describe('sendSSE', () => {
    let mockController: ReadableStreamDefaultController;
    let enqueuedData: Uint8Array[];

    beforeEach(() => {
      enqueuedData = [];
      mockController = {
        enqueue: vi.fn((data: Uint8Array) => {
          enqueuedData.push(data);
        }),
        close: vi.fn(),
        desiredSize: 1,
        error: vi.fn(),
      } as unknown as ReadableStreamDefaultController;
    });

    it('should enqueue correctly formatted SSE message', () => {
      sendSSE(mockController, 'test-event', { message: 'hello' });

      expect(mockController.enqueue).toHaveBeenCalledTimes(1);

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      expect(decoded).toBe('event: test-event\ndata: {"message":"hello"}\n\n');
    });

    it('should format event name correctly', () => {
      sendSSE(mockController, 'progress', {});

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      expect(decoded).toContain('event: progress\n');
    });

    it('should JSON stringify the data object', () => {
      const testData = { count: 42, status: 'active' };
      sendSSE(mockController, 'update', testData);

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      expect(decoded).toContain('data: {"count":42,"status":"active"}');
    });

    it('should end message with double newline', () => {
      sendSSE(mockController, 'event', { value: 1 });

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      expect(decoded).toMatch(/\n\n$/);
    });

    it('should handle empty object data', () => {
      sendSSE(mockController, 'empty', {});

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      expect(decoded).toBe('event: empty\ndata: {}\n\n');
    });

    it('should handle complex nested data', () => {
      const complexData = {
        user: { id: 'abc', name: 'Test' },
        items: [1, 2, 3],
        metadata: { nested: { deep: true } },
      };
      sendSSE(mockController, 'complex', complexData);

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      expect(decoded).toContain('event: complex\n');
      expect(decoded).toContain('data: ');

      // Parse the JSON back to verify it's valid
      const dataMatch = decoded.match(/data: (.+)\n\n/);
      expect(dataMatch).not.toBeNull();
      const parsedData = JSON.parse(dataMatch![1]);
      expect(parsedData).toEqual(complexData);
    });

    it('should handle arrays in data', () => {
      const arrayData = { items: ['a', 'b', 'c'], numbers: [1, 2, 3] };
      sendSSE(mockController, 'array', arrayData);

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      const dataMatch = decoded.match(/data: (.+)\n\n/);
      const parsedData = JSON.parse(dataMatch![1]);
      expect(parsedData.items).toEqual(['a', 'b', 'c']);
      expect(parsedData.numbers).toEqual([1, 2, 3]);
    });

    it('should handle special characters in strings', () => {
      const specialData = { text: 'hello\nworld', quote: 'say "hi"' };
      sendSSE(mockController, 'special', specialData);

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      const dataMatch = decoded.match(/data: (.+)\n\n/);
      const parsedData = JSON.parse(dataMatch![1]);
      expect(parsedData.text).toBe('hello\nworld');
      expect(parsedData.quote).toBe('say "hi"');
    });

    it('should handle boolean values', () => {
      sendSSE(mockController, 'bool', { active: true, disabled: false });

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      const dataMatch = decoded.match(/data: (.+)\n\n/);
      const parsedData = JSON.parse(dataMatch![1]);
      expect(parsedData.active).toBe(true);
      expect(parsedData.disabled).toBe(false);
    });

    it('should handle null values', () => {
      sendSSE(mockController, 'nullable', { value: null, other: 'test' });

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      const dataMatch = decoded.match(/data: (.+)\n\n/);
      const parsedData = JSON.parse(dataMatch![1]);
      expect(parsedData.value).toBeNull();
      expect(parsedData.other).toBe('test');
    });

    it('should handle event names with hyphens', () => {
      sendSSE(mockController, 'my-custom-event', { data: 1 });

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      expect(decoded).toContain('event: my-custom-event\n');
    });

    it('should handle event names with underscores', () => {
      sendSSE(mockController, 'my_custom_event', { data: 1 });

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      expect(decoded).toContain('event: my_custom_event\n');
    });

    it('should handle numeric values', () => {
      sendSSE(mockController, 'numbers', {
        integer: 42,
        float: 3.14,
        negative: -100,
        zero: 0,
      });

      const decoded = new TextDecoder().decode(enqueuedData[0]);
      const dataMatch = decoded.match(/data: (.+)\n\n/);
      const parsedData = JSON.parse(dataMatch![1]);
      expect(parsedData.integer).toBe(42);
      expect(parsedData.float).toBe(3.14);
      expect(parsedData.negative).toBe(-100);
      expect(parsedData.zero).toBe(0);
    });
  });

  describe('SSE Message Format', () => {
    it('should produce valid SSE format that can be parsed', () => {
      const events: Array<{ event: string; data: object }> = [];
      const mockController = {
        enqueue: vi.fn((data: Uint8Array) => {
          const decoded = new TextDecoder().decode(data);
          const eventMatch = decoded.match(/event: (.+)\n/);
          const dataMatch = decoded.match(/data: (.+)\n\n/);
          if (eventMatch && dataMatch) {
            events.push({
              event: eventMatch[1],
              data: JSON.parse(dataMatch[1]),
            });
          }
        }),
      } as unknown as ReadableStreamDefaultController;

      sendSSE(mockController, 'start', { phase: 'init' });
      sendSSE(mockController, 'progress', { percent: 50 });
      sendSSE(mockController, 'complete', { success: true });

      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({ event: 'start', data: { phase: 'init' } });
      expect(events[1]).toEqual({ event: 'progress', data: { percent: 50 } });
      expect(events[2]).toEqual({ event: 'complete', data: { success: true } });
    });
  });

  describe('Integration', () => {
    it('should work together to create a complete SSE stream', async () => {
      const events: string[] = [];

      const stream = new ReadableStream({
        start(controller) {
          sendSSE(controller, 'start', { time: Date.now() });
          sendSSE(controller, 'data', { items: [1, 2, 3] });
          sendSSE(controller, 'end', { done: true });
          controller.close();
        },
      });

      const response = createSSEResponse(stream);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');

      // Read all chunks from the stream
      const reader = response.body!.getReader();
      const chunks: string[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(new TextDecoder().decode(value));
      }

      const fullOutput = chunks.join('');
      expect(fullOutput).toContain('event: start\n');
      expect(fullOutput).toContain('event: data\n');
      expect(fullOutput).toContain('event: end\n');
      expect(fullOutput).toContain('"items":[1,2,3]');
      expect(fullOutput).toContain('"done":true');
    });
  });
});
