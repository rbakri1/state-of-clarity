/**
 * JSON Parse Retry Helper
 *
 * Retries LLM calls when JSON parsing fails, appending a stricter
 * prompt to ensure valid JSON output on the retry.
 */

export interface JsonParseRetryOptions {
  maxRetries?: number;
  agentName?: string;
}

/**
 * Parse JSON from an LLM response with retry logic.
 *
 * If JSON.parse fails, retries the LLM call with a stricter prompt
 * appended: "You MUST return valid JSON only."
 *
 * @param llmCall - Function that calls the LLM and returns the response text.
 *                  Receives a boolean `isRetry` indicating if this is a retry attempt.
 * @param extractJson - Function to extract JSON string from the LLM response (e.g., regex match).
 * @param options - Optional configuration for retries.
 * @returns Parsed JSON object.
 * @throws Error after max retries exhausted with descriptive message.
 *
 * @example
 * const result = await parseJsonWithRetry<MyType>(
 *   async (isRetry) => {
 *     const prompt = isRetry
 *       ? `${basePrompt}\n\nYou MUST return valid JSON only.`
 *       : basePrompt;
 *     const response = await anthropic.messages.create({ ... });
 *     return response.content[0].type === 'text' ? response.content[0].text : '';
 *   },
 *   (text) => text.match(/\{[\s\S]*\}/)?.[0] ?? null
 * );
 */
export async function parseJsonWithRetry<T>(
  llmCall: (isRetry: boolean) => Promise<string>,
  extractJson: (responseText: string) => string | null,
  options: JsonParseRetryOptions = {}
): Promise<T> {
  const { maxRetries = 1, agentName = "JSON Parse" } = options;

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= maxRetries) {
    const isRetry = attempts > 0;

    try {
      const responseText = await llmCall(isRetry);

      const jsonString = extractJson(responseText);
      if (!jsonString) {
        throw new Error("Could not extract JSON from LLM response");
      }

      const parsed = JSON.parse(jsonString) as T;
      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempts++;

      if (attempts <= maxRetries) {
        console.warn(
          `[${agentName}] JSON parse failed, retrying with stricter prompt (attempt ${attempts}/${maxRetries})`
        );
      }
    }
  }

  throw new Error(
    `[${agentName}] JSON parsing failed after ${maxRetries + 1} attempts: ${lastError?.message ?? "Unknown error"}`
  );
}

/**
 * Create a stricter prompt for retry attempts.
 *
 * Appends the JSON-only instruction to the original prompt.
 */
export function createStricterPrompt(
  originalPrompt: string,
  isRetry: boolean
): string {
  if (!isRetry) {
    return originalPrompt;
  }

  return `${originalPrompt}

CRITICAL: You MUST return valid JSON only. No explanatory text before or after the JSON. Just the raw JSON object or array.`;
}
