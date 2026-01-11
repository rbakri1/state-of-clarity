/**
 * Agent Execution Logger
 *
 * Logs agent execution times and status for observability and optimization.
 * Stores logs in the agent_execution_logs table asynchronously.
 */

import { createServiceRoleClient } from '../supabase/client';

export type ExecutionStatus = 'running' | 'completed' | 'failed';
export type ExecutionMode = 'parallel' | 'sequential';

export interface ExecutionMetadata {
  inputTokenEstimate?: number;
  outputTokenEstimate?: number;
  executionMode?: ExecutionMode;
  parallelGroup?: string;
  retryAttempt?: number;
  customData?: Record<string, unknown>;
}

export interface ExecutionLogEntry {
  id?: string;
  briefId: string | null;
  agentName: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: ExecutionStatus;
  errorMessage?: string;
  metadata?: ExecutionMetadata;
}

export interface ExecutionContext {
  briefId: string | null;
  executionMode: ExecutionMode;
  parallelGroup?: string;
}

/**
 * Estimate token count from text (rough approximation: ~4 chars per token)
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Log the start of an agent execution
 * Returns an ID that can be used to complete the log entry
 */
export async function logAgentStart(
  agentName: string,
  context: ExecutionContext,
  inputSize?: number
): Promise<string | null> {
  const startedAt = new Date();

  console.log(`[ExecutionLogger] Agent started: ${agentName}`, {
    briefId: context.briefId,
    executionMode: context.executionMode,
    parallelGroup: context.parallelGroup,
    inputTokenEstimate: inputSize,
    startedAt: startedAt.toISOString(),
  });

  try {
    const supabase = createServiceRoleClient();
    const insertData = {
      brief_id: context.briefId,
      agent_name: agentName,
      started_at: startedAt.toISOString(),
      status: 'running' as const,
      metadata: {
        inputTokenEstimate: inputSize,
        executionMode: context.executionMode,
        parallelGroup: context.parallelGroup,
      },
    };
    
    // Use explicit type assertion - Supabase types may not infer correctly for new tables
    const { data, error } = await (supabase
      .from('agent_execution_logs') as any)
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error(`[ExecutionLogger] Failed to create log entry:`, error);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error(`[ExecutionLogger] Error creating log entry:`, err);
    return null;
  }
}

/**
 * Log the completion of an agent execution
 */
export async function logAgentComplete(
  logId: string | null,
  agentName: string,
  startedAt: Date,
  outputSize?: number
): Promise<void> {
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  console.log(`[ExecutionLogger] Agent completed: ${agentName}`, {
    logId,
    durationMs,
    outputTokenEstimate: outputSize,
    completedAt: completedAt.toISOString(),
  });

  if (!logId) return;

  try {
    const supabase = createServiceRoleClient();
    await (supabase
      .from('agent_execution_logs') as any)
      .update({
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        status: 'completed',
        metadata: {
          outputTokenEstimate: outputSize,
        },
      })
      .eq('id', logId);
  } catch (err) {
    console.error(`[ExecutionLogger] Error updating log entry:`, err);
  }
}

/**
 * Log a failed agent execution
 */
export async function logAgentFailed(
  logId: string | null,
  agentName: string,
  startedAt: Date,
  error: Error | string
): Promise<void> {
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();
  const errorMessage = error instanceof Error ? error.message : error;

  console.error(`[ExecutionLogger] Agent failed: ${agentName}`, {
    logId,
    durationMs,
    errorMessage,
    completedAt: completedAt.toISOString(),
  });

  if (!logId) return;

  try {
    const supabase = createServiceRoleClient();
    await (supabase
      .from('agent_execution_logs') as any)
      .update({
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', logId);
  } catch (err) {
    console.error(`[ExecutionLogger] Error updating log entry:`, err);
  }
}

/**
 * Wrap an agent function with automatic execution logging
 *
 * @example
 * const loggedResearchAgent = withExecutionLogging(
 *   'Research Agent',
 *   researchAgent,
 *   { briefId: 'abc123', executionMode: 'sequential' }
 * );
 */
export function withExecutionLogging<TArgs extends unknown[], TResult>(
  agentName: string,
  fn: (...args: TArgs) => Promise<TResult>,
  context: ExecutionContext,
  options?: {
    getInputSize?: (...args: TArgs) => number;
    getOutputSize?: (result: TResult) => number;
  }
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const startedAt = new Date();
    const inputSize = options?.getInputSize?.(...args);

    const logId = await logAgentStart(agentName, context, inputSize);

    try {
      const result = await fn(...args);
      const outputSize = options?.getOutputSize?.(result);
      
      // Non-blocking: fire and forget
      logAgentComplete(logId, agentName, startedAt, outputSize).catch(() => {});
      
      return result;
    } catch (error) {
      // Non-blocking: fire and forget
      logAgentFailed(logId, agentName, startedAt, error instanceof Error ? error : String(error)).catch(() => {});
      
      throw error;
    }
  };
}

/**
 * Execute an agent with logging (simpler API for one-off executions)
 *
 * @example
 * const result = await executeWithLogging(
 *   'Research Agent',
 *   () => researchAgent(question),
 *   { briefId: 'abc123', executionMode: 'sequential' },
 *   { inputText: question }
 * );
 */
export async function executeWithLogging<T>(
  agentName: string,
  fn: () => Promise<T>,
  context: ExecutionContext,
  options?: {
    inputText?: string;
    getOutputSize?: (result: T) => number;
  }
): Promise<T> {
  const startedAt = new Date();
  const inputSize = options?.inputText ? estimateTokenCount(options.inputText) : undefined;

  const logId = await logAgentStart(agentName, context, inputSize);

  try {
    const result = await fn();
    const outputSize = options?.getOutputSize?.(result);
    
    // Non-blocking: fire and forget
    logAgentComplete(logId, agentName, startedAt, outputSize).catch(() => {});
    
    return result;
  } catch (error) {
    // Non-blocking: fire and forget
    logAgentFailed(logId, agentName, startedAt, error instanceof Error ? error : String(error)).catch(() => {});
    
    throw error;
  }
}

/**
 * Retrieve execution logs for a brief
 */
export async function getExecutionLogsForBrief(briefId: string): Promise<ExecutionLogEntry[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase
      .from('agent_execution_logs') as any)
      .select('*')
      .eq('brief_id', briefId)
      .order('started_at', { ascending: true });

    if (error) {
      console.error(`[ExecutionLogger] Failed to retrieve logs:`, error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      briefId: row.brief_id,
      agentName: row.agent_name,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      durationMs: row.duration_ms ?? undefined,
      status: row.status,
      errorMessage: row.error_message ?? undefined,
      metadata: row.metadata as ExecutionMetadata,
    }));
  } catch (err) {
    console.error(`[ExecutionLogger] Error retrieving logs:`, err);
    return [];
  }
}

/**
 * Get performance summary for a brief
 */
export async function getBriefPerformanceSummary(briefId: string): Promise<{
  totalDurationMs: number;
  agentCount: number;
  parallelExecutions: number;
  sequentialExecutions: number;
  failedAgents: string[];
} | null> {
  const logs = await getExecutionLogsForBrief(briefId);
  
  if (logs.length === 0) return null;

  const parallelLogs = logs.filter(l => l.metadata?.executionMode === 'parallel');
  const sequentialLogs = logs.filter(l => l.metadata?.executionMode === 'sequential');
  const failedLogs = logs.filter(l => l.status === 'failed');

  // Calculate total duration (earliest start to latest completion)
  const startTimes = logs.map(l => l.startedAt.getTime());
  const endTimes = logs.filter(l => l.completedAt).map(l => l.completedAt!.getTime());
  
  const totalDurationMs = endTimes.length > 0 
    ? Math.max(...endTimes) - Math.min(...startTimes)
    : 0;

  return {
    totalDurationMs,
    agentCount: logs.length,
    parallelExecutions: parallelLogs.length,
    sequentialExecutions: sequentialLogs.length,
    failedAgents: failedLogs.map(l => l.agentName),
  };
}
