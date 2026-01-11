/**
 * Generation Events Types
 * 
 * Types for Server-Sent Events during brief generation.
 */

export type GenerationEventType = 
  | 'agent_started'
  | 'agent_completed'
  | 'stage_changed'
  | 'brief_ready'
  | 'error';

export interface GenerationEvent {
  type: GenerationEventType;
  agentName: string;
  timestamp: number;
  stageName: string;
  metadata?: {
    durationMs?: number;
    briefId?: string;
    error?: string;
    parallelGroup?: string;
    activeAgents?: string[];
  };
}

export interface AgentStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
}

export interface GenerationProgress {
  currentStage: string;
  agents: AgentStatus[];
  startedAt: number;
  completedAt?: number;
}

export type GenerationEventCallback = (event: GenerationEvent) => void;

export class GenerationEventEmitter {
  private listeners: Set<GenerationEventCallback> = new Set();
  private currentStage = 'initializing';
  private agentStatuses: Map<string, AgentStatus> = new Map();
  private startedAt: number;
  private isClosed = false;

  constructor() {
    this.startedAt = Date.now();
  }

  subscribe(callback: GenerationEventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private emit(event: GenerationEvent): void {
    if (this.isClosed) return;
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[EventEmitter] Listener error:', error);
      }
    });
  }

  agentStarted(agentName: string, stageName?: string): void {
    const timestamp = Date.now();
    
    this.agentStatuses.set(agentName, {
      name: agentName,
      status: 'running',
      startedAt: timestamp,
    });

    if (stageName && stageName !== this.currentStage) {
      this.stageChanged(stageName);
    }

    this.emit({
      type: 'agent_started',
      agentName,
      timestamp,
      stageName: stageName || this.currentStage,
      metadata: {
        activeAgents: this.getActiveAgents(),
      },
    });
  }

  agentCompleted(agentName: string, durationMs?: number): void {
    const timestamp = Date.now();
    const status = this.agentStatuses.get(agentName);
    
    this.agentStatuses.set(agentName, {
      name: agentName,
      status: 'completed',
      startedAt: status?.startedAt,
      completedAt: timestamp,
      durationMs: durationMs || (status?.startedAt ? timestamp - status.startedAt : undefined),
    });

    this.emit({
      type: 'agent_completed',
      agentName,
      timestamp,
      stageName: this.currentStage,
      metadata: {
        durationMs: durationMs || (status?.startedAt ? timestamp - status.startedAt : undefined),
        activeAgents: this.getActiveAgents(),
      },
    });
  }

  agentFailed(agentName: string, error: string): void {
    const timestamp = Date.now();
    const status = this.agentStatuses.get(agentName);
    
    this.agentStatuses.set(agentName, {
      name: agentName,
      status: 'failed',
      startedAt: status?.startedAt,
      completedAt: timestamp,
      durationMs: status?.startedAt ? timestamp - status.startedAt : undefined,
    });

    this.emit({
      type: 'error',
      agentName,
      timestamp,
      stageName: this.currentStage,
      metadata: {
        error,
        activeAgents: this.getActiveAgents(),
      },
    });
  }

  stageChanged(stageName: string): void {
    this.currentStage = stageName;
    
    this.emit({
      type: 'stage_changed',
      agentName: '',
      timestamp: Date.now(),
      stageName,
      metadata: {
        activeAgents: this.getActiveAgents(),
      },
    });
  }

  briefReady(briefId: string): void {
    const timestamp = Date.now();
    
    this.emit({
      type: 'brief_ready',
      agentName: '',
      timestamp,
      stageName: 'complete',
      metadata: {
        briefId,
        durationMs: timestamp - this.startedAt,
      },
    });

    this.close();
  }

  error(message: string): void {
    this.emit({
      type: 'error',
      agentName: '',
      timestamp: Date.now(),
      stageName: this.currentStage,
      metadata: {
        error: message,
      },
    });
  }

  close(): void {
    this.isClosed = true;
    this.listeners.clear();
  }

  private getActiveAgents(): string[] {
    return Array.from(this.agentStatuses.entries())
      .filter(([, status]) => status.status === 'running')
      .map(([name]) => name);
  }

  getProgress(): GenerationProgress {
    return {
      currentStage: this.currentStage,
      agents: Array.from(this.agentStatuses.values()),
      startedAt: this.startedAt,
    };
  }
}
