/**
 * JSON Parse Retry Unit Tests
 *
 * Tests for the JSON parsing retry utility functions.
 * Tests parseJsonWithRetry and createStricterPrompt.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseJsonWithRetry,
  createStricterPrompt,
  JsonParseRetryOptions,
} from '@/lib/agents/json-parse-retry';

describe('JSON Parse Retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseJsonWithRetry', () => {
    describe('Success Cases', () => {
      it('should parse valid JSON on first attempt', async () => {
        const llmCall = vi.fn().mockResolvedValue('{"name":"test","value":42}');
        const extractJson = vi.fn((text: string) => text);

        const result = await parseJsonWithRetry<{ name: string; value: number }>(
          llmCall,
          extractJson
        );

        expect(result).toEqual({ name: 'test', value: 42 });
        expect(llmCall).toHaveBeenCalledTimes(1);
        expect(llmCall).toHaveBeenCalledWith(false); // isRetry = false
      });

      it('should extract JSON from surrounding text', async () => {
        const response = 'Here is the result: {"status":"ok"} Hope this helps!';
        const llmCall = vi.fn().mockResolvedValue(response);
        const extractJson = vi.fn((text: string) => {
          const match = text.match(/\{[\s\S]*\}/);
          return match ? match[0] : null;
        });

        const result = await parseJsonWithRetry<{ status: string }>(llmCall, extractJson);

        expect(result).toEqual({ status: 'ok' });
      });

      it('should handle arrays', async () => {
        const llmCall = vi.fn().mockResolvedValue('[1, 2, 3]');
        const extractJson = vi.fn((text: string) => text);

        const result = await parseJsonWithRetry<number[]>(llmCall, extractJson);

        expect(result).toEqual([1, 2, 3]);
      });

      it('should handle nested objects', async () => {
        const nestedJson = JSON.stringify({
          user: { id: 'abc', profile: { name: 'Test', age: 25 } },
          items: [{ id: 1 }, { id: 2 }],
        });
        const llmCall = vi.fn().mockResolvedValue(nestedJson);
        const extractJson = vi.fn((text: string) => text);

        const result = await parseJsonWithRetry<any>(llmCall, extractJson);

        expect(result.user.id).toBe('abc');
        expect(result.user.profile.name).toBe('Test');
        expect(result.items).toHaveLength(2);
      });

      it('should handle empty objects', async () => {
        const llmCall = vi.fn().mockResolvedValue('{}');
        const extractJson = vi.fn((text: string) => text);

        const result = await parseJsonWithRetry<object>(llmCall, extractJson);

        expect(result).toEqual({});
      });

      it('should handle empty arrays', async () => {
        const llmCall = vi.fn().mockResolvedValue('[]');
        const extractJson = vi.fn((text: string) => text);

        const result = await parseJsonWithRetry<any[]>(llmCall, extractJson);

        expect(result).toEqual([]);
      });
    });

    describe('Retry Logic', () => {
      it('should retry once on parse failure by default', async () => {
        const llmCall = vi
          .fn()
          .mockResolvedValueOnce('invalid json')
          .mockResolvedValueOnce('{"success": true}');
        const extractJson = vi.fn((text: string) => text);

        const result = await parseJsonWithRetry<{ success: boolean }>(llmCall, extractJson);

        expect(result).toEqual({ success: true });
        expect(llmCall).toHaveBeenCalledTimes(2);
        expect(llmCall).toHaveBeenNthCalledWith(1, false); // First call: isRetry = false
        expect(llmCall).toHaveBeenNthCalledWith(2, true); // Second call: isRetry = true
      });

      it('should respect maxRetries option', async () => {
        const llmCall = vi
          .fn()
          .mockResolvedValueOnce('bad1')
          .mockResolvedValueOnce('bad2')
          .mockResolvedValueOnce('bad3')
          .mockResolvedValueOnce('{"ok":true}');
        const extractJson = vi.fn((text: string) => text);

        const result = await parseJsonWithRetry<{ ok: boolean }>(llmCall, extractJson, {
          maxRetries: 3,
        });

        expect(result).toEqual({ ok: true });
        expect(llmCall).toHaveBeenCalledTimes(4);
      });

      it('should pass isRetry=true on retry attempts', async () => {
        const llmCall = vi
          .fn()
          .mockResolvedValueOnce('not json')
          .mockResolvedValueOnce('{"retried":true}');
        const extractJson = vi.fn((text: string) => text);

        await parseJsonWithRetry(llmCall, extractJson);

        expect(llmCall.mock.calls[0][0]).toBe(false);
        expect(llmCall.mock.calls[1][0]).toBe(true);
      });

      it('should retry when extractJson returns null', async () => {
        const llmCall = vi
          .fn()
          .mockResolvedValueOnce('no json here')
          .mockResolvedValueOnce('here: {"found":true}');
        const extractJson = vi.fn((text: string) => {
          const match = text.match(/\{[\s\S]*\}/);
          return match ? match[0] : null;
        });

        const result = await parseJsonWithRetry<{ found: boolean }>(llmCall, extractJson);

        expect(result).toEqual({ found: true });
        expect(llmCall).toHaveBeenCalledTimes(2);
      });
    });

    describe('Error Handling', () => {
      it('should throw after max retries exhausted', async () => {
        const llmCall = vi.fn().mockResolvedValue('always invalid');
        const extractJson = vi.fn((text: string) => text);

        await expect(
          parseJsonWithRetry(llmCall, extractJson, { maxRetries: 1 })
        ).rejects.toThrow(/JSON parsing failed after 2 attempts/);

        expect(llmCall).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
      });

      it('should include agent name in error message', async () => {
        const llmCall = vi.fn().mockResolvedValue('bad');
        const extractJson = vi.fn((text: string) => text);

        await expect(
          parseJsonWithRetry(llmCall, extractJson, { agentName: 'TestAgent' })
        ).rejects.toThrow(/\[TestAgent\] JSON parsing failed/);
      });

      it('should include original error message in thrown error', async () => {
        const llmCall = vi.fn().mockResolvedValue('{broken');
        const extractJson = vi.fn((text: string) => text);

        await expect(
          parseJsonWithRetry(llmCall, extractJson, { maxRetries: 0 })
        ).rejects.toThrow();
      });

      it('should throw when extractJson always returns null', async () => {
        const llmCall = vi.fn().mockResolvedValue('no json anywhere');
        const extractJson = vi.fn().mockReturnValue(null);

        await expect(parseJsonWithRetry(llmCall, extractJson)).rejects.toThrow(
          /Could not extract JSON from LLM response/
        );
      });

      it('should handle maxRetries = 0', async () => {
        const llmCall = vi.fn().mockResolvedValue('invalid');
        const extractJson = vi.fn((text: string) => text);

        await expect(
          parseJsonWithRetry(llmCall, extractJson, { maxRetries: 0 })
        ).rejects.toThrow(/after 1 attempts/);

        expect(llmCall).toHaveBeenCalledTimes(1);
      });

      it('should handle LLM call throwing an error', async () => {
        const llmCall = vi.fn().mockRejectedValue(new Error('API error'));
        const extractJson = vi.fn((text: string) => text);

        await expect(
          parseJsonWithRetry(llmCall, extractJson, { maxRetries: 0 })
        ).rejects.toThrow(/API error/);
      });

      it('should retry when LLM throws then succeeds', async () => {
        const llmCall = vi
          .fn()
          .mockRejectedValueOnce(new Error('Temporary error'))
          .mockResolvedValueOnce('{"recovered":true}');
        const extractJson = vi.fn((text: string) => text);

        const result = await parseJsonWithRetry<{ recovered: boolean }>(llmCall, extractJson);

        expect(result).toEqual({ recovered: true });
        expect(llmCall).toHaveBeenCalledTimes(2);
      });
    });

    describe('Options', () => {
      it('should use default agentName when not provided', async () => {
        const llmCall = vi.fn().mockResolvedValue('bad');
        const extractJson = vi.fn((text: string) => text);

        await expect(parseJsonWithRetry(llmCall, extractJson)).rejects.toThrow(
          /\[JSON Parse\]/
        );
      });

      it('should use custom agentName when provided', async () => {
        const llmCall = vi.fn().mockResolvedValue('bad');
        const extractJson = vi.fn((text: string) => text);

        await expect(
          parseJsonWithRetry(llmCall, extractJson, { agentName: 'CustomAgent' })
        ).rejects.toThrow(/\[CustomAgent\]/);
      });

      it('should use default maxRetries of 1 when not provided', async () => {
        const llmCall = vi.fn().mockResolvedValue('bad');
        const extractJson = vi.fn((text: string) => text);

        await expect(parseJsonWithRetry(llmCall, extractJson)).rejects.toThrow(
          /after 2 attempts/
        );

        expect(llmCall).toHaveBeenCalledTimes(2);
      });
    });

    describe('Console Logging', () => {
      it('should log warning on retry', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const llmCall = vi
          .fn()
          .mockResolvedValueOnce('bad')
          .mockResolvedValueOnce('{"ok":true}');
        const extractJson = vi.fn((text: string) => text);

        await parseJsonWithRetry(llmCall, extractJson, { agentName: 'TestAgent' });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[TestAgent] JSON parse failed')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('retrying with stricter prompt')
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('createStricterPrompt', () => {
    it('should return original prompt when isRetry is false', () => {
      const original = 'Please analyze this data and return JSON.';
      const result = createStricterPrompt(original, false);

      expect(result).toBe(original);
    });

    it('should append stricter instructions when isRetry is true', () => {
      const original = 'Please analyze this data and return JSON.';
      const result = createStricterPrompt(original, true);

      expect(result).toContain(original);
      expect(result).toContain('CRITICAL');
      expect(result).toContain('valid JSON only');
    });

    it('should preserve original prompt content when retrying', () => {
      const original = 'Extract entities from: "John works at Acme Corp"';
      const result = createStricterPrompt(original, true);

      expect(result).toContain('John works at Acme Corp');
    });

    it('should add instruction about no explanatory text', () => {
      const original = 'Return JSON';
      const result = createStricterPrompt(original, true);

      expect(result).toContain('No explanatory text');
    });

    it('should work with empty original prompt', () => {
      const result = createStricterPrompt('', false);
      expect(result).toBe('');

      const retryResult = createStricterPrompt('', true);
      expect(retryResult).toContain('CRITICAL');
    });

    it('should work with multi-line original prompt', () => {
      const original = `Analyze the following:
- Item 1
- Item 2
- Item 3

Return your analysis as JSON.`;

      const result = createStricterPrompt(original, true);

      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Item 3');
      expect(result).toContain('CRITICAL');
    });

    it('should handle special characters in prompt', () => {
      const original = 'Parse: {"key": "value with \\"quotes\\""}';
      const result = createStricterPrompt(original, true);

      expect(result).toContain('value with \\"quotes\\"');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with realistic LLM response extraction', async () => {
      const llmResponse = `I'll analyze this for you.

Here is the result:
\`\`\`json
{
  "entities": ["John", "Acme Corp"],
  "sentiment": "neutral"
}
\`\`\`

Let me know if you need anything else!`;

      const llmCall = vi.fn().mockResolvedValue(llmResponse);
      const extractJson = vi.fn((text: string) => {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) return match[1].trim();
        const objectMatch = text.match(/\{[\s\S]*\}/);
        return objectMatch ? objectMatch[0] : null;
      });

      const result = await parseJsonWithRetry<{
        entities: string[];
        sentiment: string;
      }>(llmCall, extractJson);

      expect(result.entities).toEqual(['John', 'Acme Corp']);
      expect(result.sentiment).toBe('neutral');
    });

    it('should handle retry scenario with stricter prompt', async () => {
      // First call returns text with JSON embedded, second call returns clean JSON
      const llmCall = vi.fn().mockImplementation(async (isRetry: boolean) => {
        if (!isRetry) {
          return 'Here is the analysis: {invalid json}';
        }
        return '{"clean": true}';
      });

      const extractJson = vi.fn((text: string) => {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? match[0] : null;
      });

      const result = await parseJsonWithRetry<{ clean: boolean }>(llmCall, extractJson);

      expect(result).toEqual({ clean: true });
      expect(llmCall).toHaveBeenCalledTimes(2);
    });
  });
});
