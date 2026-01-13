/**
 * Tests for lib/types/generation-events.ts
 *
 * Tests the GenerationEventEmitter class for SSE during brief generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  GenerationEventEmitter,
  type GenerationEvent,
  type GenerationEventCallback,
} from "@/lib/types/generation-events";

describe("generation-events", () => {
  describe("GenerationEventEmitter", () => {
    let emitter: GenerationEventEmitter;

    beforeEach(() => {
      emitter = new GenerationEventEmitter();
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe("constructor", () => {
      it("initializes with correct default state", () => {
        const progress = emitter.getProgress();

        expect(progress.currentStage).toBe("initializing");
        expect(progress.agents).toEqual([]);
        expect(progress.startedAt).toBeLessThanOrEqual(Date.now());
      });

      it("sets startedAt timestamp on creation", () => {
        const beforeCreation = Date.now();
        const testEmitter = new GenerationEventEmitter();
        const afterCreation = Date.now();

        const progress = testEmitter.getProgress();
        expect(progress.startedAt).toBeGreaterThanOrEqual(beforeCreation);
        expect(progress.startedAt).toBeLessThanOrEqual(afterCreation);
      });
    });

    describe("subscribe", () => {
      it("allows subscribing to events", () => {
        const callback = vi.fn();

        const unsubscribe = emitter.subscribe(callback);

        expect(typeof unsubscribe).toBe("function");
      });

      it("returns unsubscribe function that works", () => {
        const callback = vi.fn();

        const unsubscribe = emitter.subscribe(callback);
        unsubscribe();

        emitter.agentStarted("TestAgent");
        expect(callback).not.toHaveBeenCalled();
      });

      it("notifies multiple subscribers", () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        emitter.subscribe(callback1);
        emitter.subscribe(callback2);
        emitter.agentStarted("TestAgent");

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });

    describe("agentStarted", () => {
      it("emits agent_started event", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.agentStarted("TestAgent");

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "agent_started",
            agentName: "TestAgent",
          })
        );
      });

      it("includes timestamp in event", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        const beforeCall = Date.now();
        emitter.agentStarted("TestAgent");
        const afterCall = Date.now();

        const event = callback.mock.calls[0][0] as GenerationEvent;
        expect(event.timestamp).toBeGreaterThanOrEqual(beforeCall);
        expect(event.timestamp).toBeLessThanOrEqual(afterCall);
      });

      it("updates agent status to running", () => {
        emitter.agentStarted("TestAgent");

        const progress = emitter.getProgress();
        const agent = progress.agents.find((a) => a.name === "TestAgent");

        expect(agent?.status).toBe("running");
        expect(agent?.startedAt).toBeDefined();
      });

      it("changes stage when stageName is provided", () => {
        emitter.agentStarted("TestAgent", "research");

        const progress = emitter.getProgress();
        expect(progress.currentStage).toBe("research");
      });

      it("includes active agents in metadata", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.agentStarted("Agent1");
        emitter.agentStarted("Agent2");

        const lastEvent = callback.mock.calls[1][0] as GenerationEvent;
        expect(lastEvent.metadata?.activeAgents).toContain("Agent1");
        expect(lastEvent.metadata?.activeAgents).toContain("Agent2");
      });
    });

    describe("agentCompleted", () => {
      it("emits agent_completed event", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.agentStarted("TestAgent");
        emitter.agentCompleted("TestAgent");

        expect(callback).toHaveBeenLastCalledWith(
          expect.objectContaining({
            type: "agent_completed",
            agentName: "TestAgent",
          })
        );
      });

      it("updates agent status to completed", () => {
        emitter.agentStarted("TestAgent");
        emitter.agentCompleted("TestAgent");

        const progress = emitter.getProgress();
        const agent = progress.agents.find((a) => a.name === "TestAgent");

        expect(agent?.status).toBe("completed");
        expect(agent?.completedAt).toBeDefined();
      });

      it("uses provided durationMs if given", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.agentCompleted("TestAgent", 5000);

        const event = callback.mock.calls[0][0] as GenerationEvent;
        expect(event.metadata?.durationMs).toBe(5000);
      });

      it("calculates duration from startedAt if not provided", () => {
        emitter.agentStarted("TestAgent");
        emitter.agentCompleted("TestAgent");

        const progress = emitter.getProgress();
        const agent = progress.agents.find((a) => a.name === "TestAgent");

        expect(agent?.durationMs).toBeDefined();
        expect(agent?.durationMs).toBeGreaterThanOrEqual(0);
      });

      it("removes completed agent from active agents list", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.agentStarted("Agent1");
        emitter.agentStarted("Agent2");
        emitter.agentCompleted("Agent1");

        const lastEvent = callback.mock.calls[callback.mock.calls.length - 1][0] as GenerationEvent;
        expect(lastEvent.metadata?.activeAgents).not.toContain("Agent1");
        expect(lastEvent.metadata?.activeAgents).toContain("Agent2");
      });
    });

    describe("agentFailed", () => {
      it("emits error event", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.agentStarted("TestAgent");
        emitter.agentFailed("TestAgent", "Something went wrong");

        expect(callback).toHaveBeenLastCalledWith(
          expect.objectContaining({
            type: "error",
            agentName: "TestAgent",
          })
        );
      });

      it("includes error message in metadata", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.agentFailed("TestAgent", "Connection timeout");

        const event = callback.mock.calls[0][0] as GenerationEvent;
        expect(event.metadata?.error).toBe("Connection timeout");
      });

      it("updates agent status to failed", () => {
        emitter.agentStarted("TestAgent");
        emitter.agentFailed("TestAgent", "Error");

        const progress = emitter.getProgress();
        const agent = progress.agents.find((a) => a.name === "TestAgent");

        expect(agent?.status).toBe("failed");
      });
    });

    describe("stageChanged", () => {
      it("emits stage_changed event", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.stageChanged("scoring");

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "stage_changed",
            stageName: "scoring",
          })
        );
      });

      it("updates currentStage", () => {
        emitter.stageChanged("research");

        const progress = emitter.getProgress();
        expect(progress.currentStage).toBe("research");
      });

      it("has empty agentName for stage events", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.stageChanged("summary");

        const event = callback.mock.calls[0][0] as GenerationEvent;
        expect(event.agentName).toBe("");
      });
    });

    describe("briefReady", () => {
      it("emits brief_ready event", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.briefReady("brief-123");

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "brief_ready",
            stageName: "complete",
          })
        );
      });

      it("includes briefId in metadata", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.briefReady("brief-abc");

        const event = callback.mock.calls[0][0] as GenerationEvent;
        expect(event.metadata?.briefId).toBe("brief-abc");
      });

      it("includes total duration in metadata", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.briefReady("brief-123");

        const event = callback.mock.calls[0][0] as GenerationEvent;
        expect(event.metadata?.durationMs).toBeDefined();
        expect(event.metadata?.durationMs).toBeGreaterThanOrEqual(0);
      });

      it("closes the emitter after briefReady", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.briefReady("brief-123");
        emitter.agentStarted("NewAgent");

        // Only one call - the brief_ready event
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    describe("error", () => {
      it("emits error event with message", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.error("Something went wrong");

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            metadata: expect.objectContaining({
              error: "Something went wrong",
            }),
          })
        );
      });

      it("has empty agentName for general errors", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.error("General error");

        const event = callback.mock.calls[0][0] as GenerationEvent;
        expect(event.agentName).toBe("");
      });
    });

    describe("close", () => {
      it("stops emitting events after close", () => {
        const callback = vi.fn();
        emitter.subscribe(callback);

        emitter.close();
        emitter.agentStarted("TestAgent");

        expect(callback).not.toHaveBeenCalled();
      });

      it("clears all listeners", () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        emitter.subscribe(callback1);
        emitter.subscribe(callback2);
        emitter.close();

        emitter.agentStarted("TestAgent");

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
      });
    });

    describe("getProgress", () => {
      it("returns current stage", () => {
        emitter.stageChanged("research");

        const progress = emitter.getProgress();
        expect(progress.currentStage).toBe("research");
      });

      it("returns all agent statuses", () => {
        emitter.agentStarted("Agent1");
        emitter.agentStarted("Agent2");
        emitter.agentCompleted("Agent1");

        const progress = emitter.getProgress();
        expect(progress.agents.length).toBe(2);
      });

      it("returns startedAt timestamp", () => {
        const progress = emitter.getProgress();
        expect(progress.startedAt).toBeDefined();
        expect(typeof progress.startedAt).toBe("number");
      });
    });

    describe("listener error handling", () => {
      it("continues emitting even if a listener throws", () => {
        const badCallback = vi.fn().mockImplementation(() => {
          throw new Error("Listener error");
        });
        const goodCallback = vi.fn();

        emitter.subscribe(badCallback);
        emitter.subscribe(goodCallback);

        emitter.agentStarted("TestAgent");

        expect(badCallback).toHaveBeenCalled();
        expect(goodCallback).toHaveBeenCalled();
      });

      it("logs error when listener throws", () => {
        const badCallback = vi.fn().mockImplementation(() => {
          throw new Error("Listener error");
        });

        emitter.subscribe(badCallback);
        emitter.agentStarted("TestAgent");

        expect(console.error).toHaveBeenCalled();
      });
    });
  });
});
