/**
 * useGenerationStream Hook
 * 
 * Subscribes to Server-Sent Events for real-time brief generation status updates.
 * Manages agent statuses and current stage for SwarmVisualization component.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  GenerationEvent,
  AgentStatus,
} from "@/lib/types/generation-events";

interface GenerationState {
  isGenerating: boolean;
  currentStage: string;
  agentStatuses: AgentStatus[];
  briefId: string | null;
  error: string | null;
  isComplete: boolean;
}

interface UseGenerationStreamReturn extends GenerationState {
  startGeneration: (question: string, userId?: string) => void;
  reset: () => void;
}

const initialState: GenerationState = {
  isGenerating: false,
  currentStage: "initializing",
  agentStatuses: [],
  briefId: null,
  error: null,
  isComplete: false,
};

export function useGenerationStream(): UseGenerationStreamReturn {
  const [state, setState] = useState<GenerationState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateAgentStatus = useCallback(
    (name: string, status: AgentStatus["status"], durationMs?: number) => {
      setState((prev) => {
        const existingIndex = prev.agentStatuses.findIndex(
          (a) => a.name === name
        );
        const now = Date.now();
        const newStatus: AgentStatus = {
          name,
          status,
          ...(status === "running" && { startedAt: now }),
          ...(status === "completed" && { completedAt: now, durationMs }),
          ...(status === "failed" && { completedAt: now }),
        };

        if (existingIndex >= 0) {
          const updatedStatuses = [...prev.agentStatuses];
          updatedStatuses[existingIndex] = {
            ...updatedStatuses[existingIndex],
            ...newStatus,
          };
          return { ...prev, agentStatuses: updatedStatuses };
        } else {
          return {
            ...prev,
            agentStatuses: [...prev.agentStatuses, newStatus],
          };
        }
      });
    },
    []
  );

  const handleEvent = useCallback(
    (event: GenerationEvent) => {
      switch (event.type) {
        case "agent_started":
          updateAgentStatus(event.agentName, "running");
          if (event.stageName) {
            setState((prev) => ({ ...prev, currentStage: event.stageName }));
          }
          break;

        case "agent_completed":
          updateAgentStatus(
            event.agentName,
            "completed",
            event.metadata?.durationMs
          );
          break;

        case "stage_changed":
          setState((prev) => ({
            ...prev,
            currentStage: event.stageName,
            ...(event.metadata?.briefId && { briefId: event.metadata.briefId }),
          }));
          break;

        case "brief_ready":
          setState((prev) => ({
            ...prev,
            isComplete: true,
            isGenerating: false,
            currentStage: "complete",
            briefId: event.metadata?.briefId || prev.briefId,
          }));
          break;

        case "error":
          if (event.agentName) {
            updateAgentStatus(event.agentName, "failed");
          }
          setState((prev) => ({
            ...prev,
            error: event.metadata?.error || "An error occurred",
            isGenerating: false,
          }));
          break;
      }
    },
    [updateAgentStatus]
  );

  const startGeneration = useCallback(
    async (question: string, userId?: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState({
        isGenerating: true,
        currentStage: "initializing",
        agentStatuses: [],
        briefId: null,
        error: null,
        isComplete: false,
      });

      try {
        const response = await fetch("/api/briefs/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question, userId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to start generation");
        }

        const briefId = response.headers.get("X-Brief-Id");
        if (briefId) {
          setState((prev) => ({ ...prev, briefId }));
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

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(line.slice(6));
                handleEvent(eventData as GenerationEvent);
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
          error: error instanceof Error ? error.message : "Unknown error",
          isGenerating: false,
        }));
      }
    },
    [handleEvent]
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

export default useGenerationStream;
