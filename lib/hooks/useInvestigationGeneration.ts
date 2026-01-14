/**
 * useInvestigationGeneration Hook
 *
 * Subscribes to Server-Sent Events for real-time accountability investigation
 * generation status updates. Manages agent statuses and current stage.
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type GenerationStatus =
  | "idle"
  | "generating"
  | "complete"
  | "error"
  | "quality_failed";

export type AgentName =
  | "entity_classification"
  | "uk_profile_research"
  | "corruption_analysis"
  | "action_list_generation"
  | "quality_check";

export type AgentStatusType = "pending" | "running" | "completed" | "failed";

export interface AgentStatus {
  name: AgentName;
  status: AgentStatusType;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
}

interface GenerationState {
  status: GenerationStatus;
  progress: number;
  currentStage: string;
  agentStatuses: AgentStatus[];
  investigationId: string | null;
  qualityScore: number | null;
  creditRefunded: boolean;
  error: string | null;
}

interface UseInvestigationGenerationReturn extends GenerationState {
  startGeneration: () => void;
  reset: () => void;
}

const AGENT_ORDER: AgentName[] = [
  "entity_classification",
  "uk_profile_research",
  "corruption_analysis",
  "action_list_generation",
  "quality_check",
];

const initialAgentStatuses: AgentStatus[] = AGENT_ORDER.map((name) => ({
  name,
  status: "pending" as const,
}));

const initialState: GenerationState = {
  status: "idle",
  progress: 0,
  currentStage: "",
  agentStatuses: initialAgentStatuses,
  investigationId: null,
  qualityScore: null,
  creditRefunded: false,
  error: null,
};

export function useInvestigationGeneration(
  targetEntity: string,
  ethicsAcknowledged: boolean
): UseInvestigationGenerationReturn {
  const [state, setState] = useState<GenerationState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateAgentStatus = useCallback(
    (agentName: string, status: AgentStatusType, durationMs?: number) => {
      setState((prev) => {
        const updatedStatuses = prev.agentStatuses.map((agent) => {
          if (agent.name === agentName) {
            return {
              ...agent,
              status,
              ...(status === "running" && { startedAt: Date.now() }),
              ...(status === "completed" && {
                completedAt: Date.now(),
                durationMs,
              }),
            };
          }
          return agent;
        });

        const completedCount = updatedStatuses.filter(
          (a) => a.status === "completed"
        ).length;
        const progress = Math.min(
          95,
          (completedCount / AGENT_ORDER.length) * 100
        );

        return {
          ...prev,
          agentStatuses: updatedStatuses,
          progress,
        };
      });
    },
    []
  );

  const startGeneration = useCallback(async () => {
    if (!targetEntity.trim() || !ethicsAcknowledged) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState({
      ...initialState,
      status: "generating",
      agentStatuses: [...initialAgentStatuses],
    });

    try {
      const response = await fetch("/api/accountability/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetEntity: targetEntity.trim(),
          ethicsAcknowledged,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = "Failed to start generation";
        try {
          const text = await response.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          }
        } catch {
          console.warn("[SSE] Failed to parse error response");
        }
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
          creditRefunded: response.status !== 402,
        }));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              handleSSEEvent(currentEvent, data);
            } catch {
              console.warn("[SSE] Failed to parse event:", line);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [targetEntity, ethicsAcknowledged, updateAgentStatus]);

  const handleSSEEvent = useCallback(
    (eventType: string, data: Record<string, unknown>) => {
      switch (eventType) {
        case "agent_started":
          updateAgentStatus(data.agent as string, "running");
          setState((prev) => ({
            ...prev,
            currentStage: data.agent as string,
          }));
          break;

        case "agent_completed":
          updateAgentStatus(
            data.agent as string,
            "completed",
            data.duration as number
          );
          break;

        case "stage_changed":
          setState((prev) => ({
            ...prev,
            currentStage: data.stage as string,
          }));
          break;

        case "complete":
          setState((prev) => ({
            ...prev,
            status: data.creditRefunded ? "quality_failed" : "complete",
            progress: 100,
            investigationId: data.investigationId as string,
            qualityScore: data.qualityScore as number,
            creditRefunded: data.creditRefunded as boolean,
          }));
          break;

        case "error":
          setState((prev) => ({
            ...prev,
            status: "error",
            error: data.message as string,
            creditRefunded: data.creditRefunded as boolean,
          }));
          break;
      }
    },
    [updateAgentStatus]
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(initialState);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    startGeneration,
    reset,
  };
}

export default useInvestigationGeneration;
