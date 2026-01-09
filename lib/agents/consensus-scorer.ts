/**
 * Consensus Scorer
 *
 * Orchestrates parallel execution of the 3-evaluator consensus panel.
 * Runs Skeptic, Advocate, and Generalist in parallel, collects verdicts.
 * Target: All 3 evaluators complete in <8 seconds total.
 */

import {
  getEvaluatorPersona,
  getPrimaryEvaluatorRoles,
  EvaluatorPersona,
} from "./clarity-evaluator-personas";
import {
  evaluateBrief,
  Brief,
  EvaluateBriefInput,
} from "./clarity-evaluator-agent";
import { EvaluatorVerdict } from "../types/clarity-scoring";

export interface ConsensusInput {
  brief: Brief | EvaluateBriefInput;
  verdicts: EvaluatorVerdict[];
  totalDurationMs: number;
  evaluatorDurations: {
    role: string;
    durationMs: number;
  }[];
}

export interface EvaluatorExecutionLog {
  role: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  success: boolean;
  error?: string;
  retryCount: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 500,
  maxDelayMs: 3000,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 200;
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

async function evaluateWithRetry(
  brief: Brief | EvaluateBriefInput,
  persona: EvaluatorPersona,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ verdict: EvaluatorVerdict; log: EvaluatorExecutionLog }> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  let lastError: Error | undefined;
  let retryCount = 0;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const retryDelay = getRetryDelay(attempt - 1, config);
        console.log(
          `[Consensus Scorer] Retrying ${persona.name} (attempt ${attempt + 1}/${config.maxRetries + 1}) after ${retryDelay}ms`
        );
        await delay(retryDelay);
        retryCount++;
      }

      const verdict = await evaluateBrief(brief, persona);
      const durationMs = Date.now() - startTime;

      console.log(
        `[Consensus Scorer] ${persona.name} completed in ${durationMs}ms (retries: ${retryCount})`
      );

      return {
        verdict,
        log: {
          role: persona.role,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs,
          success: true,
          retryCount,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[Consensus Scorer] ${persona.name} failed (attempt ${attempt + 1}):`,
        lastError.message
      );
    }
  }

  const durationMs = Date.now() - startTime;
  throw {
    error: lastError,
    log: {
      role: persona.role,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      success: false,
      error: lastError?.message,
      retryCount,
    },
  };
}

/**
 * Run all 3 primary evaluators in parallel
 *
 * Executes Skeptic, Advocate, and Generalist concurrently using Promise.all.
 * Target performance: <8 seconds total (parallel execution).
 *
 * @param brief - The brief to evaluate (full Brief or minimal EvaluateBriefInput)
 * @returns ConsensusInput containing all 3 verdicts and timing information
 */
export async function runParallelEvaluators(
  brief: Brief | EvaluateBriefInput
): Promise<ConsensusInput> {
  const overallStartTime = Date.now();
  const roles = getPrimaryEvaluatorRoles();

  console.log(
    `[Consensus Scorer] Starting parallel evaluation with ${roles.length} evaluators`
  );

  const evaluationPromises = roles.map((role) => {
    const persona = getEvaluatorPersona(role);
    return evaluateWithRetry(brief, persona);
  });

  const results = await Promise.all(evaluationPromises);

  const verdicts = results.map((r) => r.verdict);
  const evaluatorDurations = results.map((r) => ({
    role: r.log.role,
    durationMs: r.log.durationMs,
  }));

  const totalDurationMs = Date.now() - overallStartTime;

  console.log(
    `[Consensus Scorer] All evaluators completed in ${totalDurationMs}ms`
  );
  console.log(
    `[Consensus Scorer] Individual durations:`,
    evaluatorDurations.map((d) => `${d.role}: ${d.durationMs}ms`).join(", ")
  );

  if (totalDurationMs > 8000) {
    console.warn(
      `[Consensus Scorer] Total duration ${totalDurationMs}ms exceeds 8s target`
    );
  }

  return {
    brief,
    verdicts,
    totalDurationMs,
    evaluatorDurations,
  };
}

/**
 * Get execution logs for the most recent parallel evaluation
 * Logs are emitted to console during execution for now.
 * Future: Store in agent_execution_logs table.
 */
export function logConsensusExecution(input: ConsensusInput): void {
  console.log(`[Consensus Scorer] === Execution Summary ===`);
  console.log(`[Consensus Scorer] Total duration: ${input.totalDurationMs}ms`);
  console.log(`[Consensus Scorer] Evaluators: ${input.verdicts.length}`);

  for (const verdict of input.verdicts) {
    console.log(
      `[Consensus Scorer] ${verdict.evaluatorRole}: score=${verdict.overallScore.toFixed(1)}, ` +
        `issues=${verdict.issues.length}, confidence=${verdict.confidence.toFixed(2)}`
    );
  }

  const avgScore =
    input.verdicts.reduce((sum, v) => sum + v.overallScore, 0) /
    input.verdicts.length;
  console.log(`[Consensus Scorer] Average score: ${avgScore.toFixed(1)}`);
}
