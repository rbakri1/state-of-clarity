/**
 * Base Fixer Agent
 *
 * Abstract base class that all 7 specialized fixer agents extend.
 * Provides common functionality for prompt building, LLM calls, and response parsing.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  FixerType,
  FixerInput,
  FixerResult,
  SuggestedEdit,
  EditPriority,
} from "@/lib/types/refinement";

const HAIKU_MODEL = "claude-3-5-haiku-20241022";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[BaseFixer] Attempt ${attempt}/${retries} failed: ${lastError.message}`
      );

      if (attempt < retries) {
        const backoffMs = delayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError;
}

/**
 * Abstract base class for fixer agents
 */
export abstract class BaseFixer {
  protected anthropic: Anthropic;
  abstract readonly fixerType: FixerType;
  abstract readonly description: string;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Build the prompt for this fixer's specific domain
   * Subclasses must implement this method
   */
  protected abstract buildPrompt(input: FixerInput): string;

  /**
   * Get the system prompt for this fixer
   * Subclasses can override to customize
   */
  protected getSystemPrompt(): string {
    return `You are a specialized editor focused on ${this.description}. 
Your task is to analyze a brief and suggest targeted edits to improve it.

You MUST respond with valid JSON only, no additional text or explanation.

Response format:
{
  "suggestedEdits": [
    {
      "section": "Name of the section being edited (e.g., 'Introduction', 'Key Arguments', 'Conclusion')",
      "originalText": "The exact text that needs to be changed (copy verbatim from the brief)",
      "suggestedText": "Your suggested replacement text",
      "rationale": "Brief explanation of why this edit improves the brief",
      "priority": "critical|high|medium|low"
    }
  ],
  "confidence": 0.0-1.0
}

Guidelines:
- Only suggest edits that address your specific domain (${this.fixerType})
- Keep edits targeted and minimal - don't rewrite entire sections unnecessarily
- Prioritize based on impact: critical=major flaw, high=significant improvement, medium=helpful, low=polish
- Be precise with originalText - it must match exactly for automated replacement
- Limit to 5 most impactful edits maximum`;
  }

  /**
   * Parse the LLM response into structured SuggestedEdit objects
   */
  protected parseResponse(response: string): {
    suggestedEdits: SuggestedEdit[];
    confidence: number;
  } {
    // Extract JSON from response (Claude sometimes adds explanation text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn(`[${this.fixerType}] Could not extract JSON from response`);
      return { suggestedEdits: [], confidence: 0 };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and sanitize edits
      const suggestedEdits: SuggestedEdit[] = (parsed.suggestedEdits || [])
        .filter(
          (edit: Partial<SuggestedEdit>) =>
            edit.section &&
            edit.originalText &&
            edit.suggestedText &&
            edit.rationale
        )
        .map(
          (edit: {
            section: string;
            originalText: string;
            suggestedText: string;
            rationale: string;
            priority?: string;
          }) => ({
            section: String(edit.section),
            originalText: String(edit.originalText),
            suggestedText: String(edit.suggestedText),
            rationale: String(edit.rationale),
            priority: this.validatePriority(edit.priority),
          })
        );

      return {
        suggestedEdits,
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      };
    } catch (error) {
      console.warn(`[${this.fixerType}] Failed to parse JSON response:`, error);
      return { suggestedEdits: [], confidence: 0 };
    }
  }

  /**
   * Validate and normalize priority value
   */
  private validatePriority(priority?: string): EditPriority {
    const validPriorities: EditPriority[] = [
      "critical",
      "high",
      "medium",
      "low",
    ];
    if (priority && validPriorities.includes(priority as EditPriority)) {
      return priority as EditPriority;
    }
    return "medium";
  }

  /**
   * Main entry point - analyze brief and suggest edits
   */
  async suggestEdits(input: FixerInput): Promise<FixerResult> {
    const startTime = Date.now();

    console.log(
      `[${this.fixerType}] Starting analysis (dimension score: ${input.dimensionScore})`
    );

    const prompt = this.buildPrompt(input);

    const result = await withRetry(async () => {
      const message = await this.anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 2000,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";
      return this.parseResponse(responseText);
    });

    const processingTime = Date.now() - startTime;

    console.log(
      `[${this.fixerType}] Completed in ${processingTime}ms with ${result.suggestedEdits.length} edits`
    );

    return {
      fixerType: this.fixerType,
      suggestedEdits: result.suggestedEdits,
      confidence: result.confidence,
      processingTime,
    };
  }
}
