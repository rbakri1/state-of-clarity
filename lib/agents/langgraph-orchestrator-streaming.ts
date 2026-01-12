/**
 * LangGraph Orchestrator with Streaming Events
 *
 * Extends the base orchestrator with event callbacks for SSE streaming.
 */

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import type { QuestionClassification } from "../types/classification";
import type { Source } from "./research-agent";
import type { SpecialistPersona } from "./specialist-personas";
import type { ReadingLevel } from "./summary-prompts";
import { researchAgent } from "./research-agent";
import { classifyQuestion } from "./question-classifier";
import { getSpecialistPersona } from "./specialist-personas";
import { getSummaryPrompt } from "./summary-prompts";
import { withRetry } from "./retry-wrapper";
import { executeWithLogging, ExecutionContext } from "./execution-logger";
import { reconcileOutputs as reconcileOutputsAgent } from "./reconciliation-agent";
import { updateBriefClassification, completeBriefGeneration } from "../services/brief-service";
import type {
  StructureOutput,
  NarrativeOutput,
  ReconciliationOutput,
  SummaryOutputs,
  ClarityScore,
} from "./langgraph-orchestrator";

export interface GenerationCallbacks {
  onAgentStarted: (agentName: string, stageName: string) => void;
  onAgentCompleted: (agentName: string, stageName: string, durationMs: number) => void;
  onStageChanged: (stageName: string, activeAgents: string[]) => void;
  onError: (error: string) => void;
}

const StreamingStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  briefId: Annotation<string | null>(),
  callbacks: Annotation<GenerationCallbacks | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  sources: Annotation<Source[]>({
    reducer: (prev, next) => next ?? prev,
    default: () => [],
  }),
  classification: Annotation<QuestionClassification | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  persona: Annotation<SpecialistPersona | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  structure: Annotation<StructureOutput | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  narrative: Annotation<NarrativeOutput | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  reconciliation: Annotation<ReconciliationOutput | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  summaries: Annotation<Partial<SummaryOutputs>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  clarityScore: Annotation<ClarityScore | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  completedSteps: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

type StreamingState = typeof StreamingStateAnnotation.State;

function emit(state: StreamingState, event: 'started' | 'completed', agentName: string, stageName: string, durationMs?: number) {
  if (!state.callbacks) return;
  try {
    if (event === 'started') {
      state.callbacks.onAgentStarted(agentName, stageName);
    } else {
      state.callbacks.onAgentCompleted(agentName, stageName, durationMs || 0);
    }
  } catch (error) {
    console.error('[StreamingOrchestrator] Callback error:', error);
  }
}

function emitStageChange(state: StreamingState, stageName: string, activeAgents: string[]) {
  if (!state.callbacks) return;
  try {
    state.callbacks.onStageChanged(stageName, activeAgents);
  } catch (error) {
    console.error('[StreamingOrchestrator] Stage callback error:', error);
  }
}

function getExecutionContext(state: StreamingState, mode: 'parallel' | 'sequential', parallelGroup?: string): ExecutionContext {
  return {
    briefId: state.briefId,
    executionMode: mode,
    parallelGroup,
  };
}

async function researchNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "research";
  emitStageChange(state, stageName, ["Research Agent"]);
  emit(state, 'started', "Research Agent", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'sequential');

  const sources = await executeWithLogging(
    'Research Agent',
    () => withRetry(
      () => researchAgent(state.question),
      { agentName: 'Research Agent' }
    ),
    context,
    { inputText: state.question }
  );

  emit(state, 'completed', "Research Agent", stageName, Date.now() - startTime);

  return {
    sources,
    completedSteps: ['research'],
  };
}

async function classificationNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "classification";
  emitStageChange(state, stageName, ["Question Classifier"]);
  emit(state, 'started', "Question Classifier", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'sequential');

  const classification = await executeWithLogging(
    'Question Classifier',
    () => withRetry(
      () => classifyQuestion(state.question),
      { agentName: 'Question Classifier' }
    ),
    context,
    { inputText: state.question }
  );

  const persona = getSpecialistPersona(classification.domain);

  if (state.briefId) {
    updateBriefClassification(state.briefId, classification).catch((err) => {
      console.error('[StreamingOrchestrator] Failed to save classification:', err);
    });
  }

  emit(state, 'completed', "Question Classifier", stageName, Date.now() - startTime);

  return {
    classification,
    persona,
    completedSteps: ['classification'],
  };
}

async function structureNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "structure-narrative";
  emit(state, 'started', "Structure Agent", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'parallel', 'structure-narrative');

  const structure = await executeWithLogging(
    'Structure Agent',
    () => withRetry(
      () => generateStructure(state),
      { agentName: 'Structure Agent' }
    ),
    context
  );

  emit(state, 'completed', "Structure Agent", stageName, Date.now() - startTime);

  return {
    structure,
    completedSteps: ['structure'],
  };
}

async function narrativeNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "structure-narrative";
  emitStageChange(state, stageName, ["Structure Agent", "Narrative Agent"]);
  emit(state, 'started', "Narrative Agent", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'parallel', 'structure-narrative');

  const narrative = await executeWithLogging(
    'Narrative Agent',
    () => withRetry(
      () => generateNarrative(state),
      { agentName: 'Narrative Agent' }
    ),
    context
  );

  emit(state, 'completed', "Narrative Agent", stageName, Date.now() - startTime);

  return {
    narrative,
    completedSteps: ['narrative'],
  };
}

async function reconciliationNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "reconciliation";
  emitStageChange(state, stageName, ["Reconciliation Agent"]);
  emit(state, 'started', "Reconciliation Agent", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'sequential');

  const reconciliation = await executeWithLogging(
    'Reconciliation Agent',
    () => withRetry(
      () => reconcileOutputs(state),
      { agentName: 'Reconciliation Agent' }
    ),
    context
  );

  emit(state, 'completed', "Reconciliation Agent", stageName, Date.now() - startTime);

  return {
    reconciliation,
    completedSteps: ['reconciliation'],
  };
}

async function summaryChildNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "summaries";
  emitStageChange(state, stageName, ["Summary (Child)", "Summary (Teen)", "Summary (Undergrad)", "Summary (Postdoc)"]);
  emit(state, 'started', "Summary (Child)", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'parallel', 'summaries');

  const summary = await executeWithLogging(
    'Summary (Child)',
    () => withRetry(
      () => generateSummary(state, 'child'),
      { agentName: 'Summary (Child)' }
    ),
    context
  );

  emit(state, 'completed', "Summary (Child)", stageName, Date.now() - startTime);

  return {
    summaries: { child: summary },
    completedSteps: ['summary_child'],
  };
}

async function summaryTeenNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "summaries";
  emit(state, 'started', "Summary (Teen)", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'parallel', 'summaries');

  const summary = await executeWithLogging(
    'Summary (Teen)',
    () => withRetry(
      () => generateSummary(state, 'teen'),
      { agentName: 'Summary (Teen)' }
    ),
    context
  );

  emit(state, 'completed', "Summary (Teen)", stageName, Date.now() - startTime);

  return {
    summaries: { teen: summary },
    completedSteps: ['summary_teen'],
  };
}

async function summaryUndergradNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "summaries";
  emit(state, 'started', "Summary (Undergrad)", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'parallel', 'summaries');

  const summary = await executeWithLogging(
    'Summary (Undergrad)',
    () => withRetry(
      () => generateSummary(state, 'undergrad'),
      { agentName: 'Summary (Undergrad)' }
    ),
    context
  );

  emit(state, 'completed', "Summary (Undergrad)", stageName, Date.now() - startTime);

  return {
    summaries: { undergrad: summary },
    completedSteps: ['summary_undergrad'],
  };
}

async function summaryPostdocNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "summaries";
  emit(state, 'started', "Summary (Postdoc)", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'parallel', 'summaries');

  const summary = await executeWithLogging(
    'Summary (Postdoc)',
    () => withRetry(
      () => generateSummary(state, 'postdoc'),
      { agentName: 'Summary (Postdoc)' }
    ),
    context
  );

  emit(state, 'completed', "Summary (Postdoc)", stageName, Date.now() - startTime);

  return {
    summaries: { postdoc: summary },
    completedSteps: ['summary_postdoc'],
  };
}

async function clarityScoringNode(state: StreamingState): Promise<Partial<StreamingState>> {
  const stageName = "scoring";
  emitStageChange(state, stageName, ["Clarity Scorer"]);
  emit(state, 'started', "Clarity Scorer", stageName);
  const startTime = Date.now();

  const context = getExecutionContext(state, 'sequential');

  const clarityScore = await executeWithLogging(
    'Clarity Scorer',
    () => withRetry(
      () => scoreClarityInternal(state),
      { agentName: 'Clarity Scorer' }
    ),
    context
  );

  emit(state, 'completed', "Clarity Scorer", stageName, Date.now() - startTime);

  return {
    clarityScore,
    completedSteps: ['clarity_scoring'],
  };
}

async function generateStructure(state: StreamingState): Promise<StructureOutput> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sourceSummary = state.sources.slice(0, 10).map((s: Source) =>
    `- ${s.title} (${s.publisher}, ${s.political_lean}): ${s.content.slice(0, 200)}...`
  ).join('\n');

  const personaContext = state.persona
    ? `You are ${state.persona.name}. ${state.persona.systemPrompt}`
    : 'You are a policy analyst.';

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `${personaContext}

Analyze this policy question and create a structured breakdown:

Question: ${state.question}

Sources:
${sourceSummary}

Return a JSON object with this exact structure:
{
  "definitions": [
    {
      "term": "Key term or concept (e.g., 'Sovereignty', 'Net Migration', 'Social Contract')",
      "definition": "Clear, neutral, precise definition (1-2 sentences)",
      "source": "Academic source with author and year (e.g., 'Max Weber, Politics as a Vocation (1919)')",
      "points_of_contention": "What is debated or contested about this term? Different interpretations, political disagreements, or evolving meanings"
    }
  ],
  "factors": [
    {
      "name": "Factor name",
      "description": "What this factor is and why it matters",
      "stakeholders": ["list", "of", "affected groups or actors"],
      "impact": "How this factor influences the issue (2-3 sentences with specific evidence)"
    }
  ],
  "policies": [
    {
      "name": "Policy option name",
      "description": "What this policy involves",
      "proponents": ["groups or perspectives that support this"],
      "opponents": ["groups or perspectives that oppose this"],
      "tradeoffs": "Key tradeoffs and tensions in this approach (2-3 sentences)"
    }
  ],
  "consequences": [
    {
      "action": "A specific policy action or decision",
      "first_order": "Immediate, direct effects that follow from this action",
      "second_order": "Downstream, unintended, or longer-term effects"
    }
  ],
  "timeline": [
    {
      "date": "Date or period (e.g., '2010-2019', '1648', 'May 2025')",
      "event": "What happened",
      "significance": "Why it matters for understanding this issue"
    }
  ]
}

IMPORTANT - Include:
- 4-6 key DEFINITIONS: These are essential! Define core terms that readers need to understand the topic. Each must have a source and points_of_contention explaining what's debated about this concept.
- 3-5 factors (major considerations or forces at play)
- 2-4 policies (concrete policy options being debated)
- 2-4 consequences (second-order effects of major policy choices)
- 3-6 timeline events (key historical context)

For definitions, think: What terms would a reader need defined to truly understand this topic? What concepts have contested meanings?`
    }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Structure Agent response");
  }

  return JSON.parse(jsonMatch[0]) as StructureOutput;
}

async function generateNarrative(state: StreamingState): Promise<NarrativeOutput> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sourceSummary = state.sources.slice(0, 10).map((s: Source) =>
    `- ${s.title} (${s.publisher}, ${s.political_lean}): ${s.content.slice(0, 200)}...`
  ).join('\n');

  const personaContext = state.persona
    ? `You are ${state.persona.name}. ${state.persona.systemPrompt}`
    : 'You are a policy analyst.';

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `${personaContext}

Write a narrative analysis of this policy question:

Question: ${state.question}

Sources:
${sourceSummary}

Return a JSON object with this exact structure:
{
  "introduction": "Opening paragraph that introduces the topic and its significance (150-200 words)",
  "mainBody": "Detailed analysis covering multiple perspectives, evidence, and arguments (600-800 words)",
  "conclusion": "Summary and forward-looking perspective (100-150 words)",
  "keyTakeaways": ["3-5 key points as bullet points"]
}

Ensure balanced coverage of different viewpoints. Cite sources where appropriate.`
    }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Narrative Agent response");
  }

  return JSON.parse(jsonMatch[0]) as NarrativeOutput;
}

async function reconcileOutputs(state: StreamingState): Promise<ReconciliationOutput> {
  if (!state.structure || !state.narrative) {
    return {
      reconciledNarrative: state.narrative || {
        introduction: '',
        mainBody: '',
        conclusion: '',
        keyTakeaways: [],
      },
      changes: [],
      isConsistent: true,
    };
  }

  return reconcileOutputsAgent({
    structure: state.structure,
    narrative: state.narrative,
  });
}

async function generateSummary(state: StreamingState, level: ReadingLevel): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = getSummaryPrompt(level);

  const structureContext = state.structure
    ? `Key Factors: ${state.structure.factors.map((f: { name: string }) => f.name).join(', ')}\nPolicies: ${state.structure.policies.map((p: { name: string }) => p.name).join(', ')}`
    : '';

  const narrativeContext = state.narrative
    ? `${state.narrative.introduction}\n\n${state.narrative.mainBody}`
    : '';

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `${prompt.systemPrompt}

Question: ${state.question}

${structureContext}

${narrativeContext}

Write a summary appropriate for ${prompt.targetAudience}.
Target length: ${prompt.wordCount.min}-${prompt.wordCount.max} words.`
    }],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

async function scoreClarityInternal(state: StreamingState): Promise<ClarityScore> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sourceLeans = state.sources.reduce((acc: Record<string, number>, s: Source) => {
    acc[s.political_lean] = (acc[s.political_lean] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCredibility = state.sources.length > 0
    ? state.sources.reduce((sum: number, s: Source) => sum + s.credibility_score, 0) / state.sources.length
    : 0;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Rate this policy brief on clarity and balance:

Question: ${state.question}

Source Balance: ${JSON.stringify(sourceLeans)}
Average Source Credibility: ${avgCredibility.toFixed(1)}/10

Key Takeaways: ${state.narrative?.keyTakeaways?.join(', ') || 'N/A'}

Return a JSON object:
{
  "overall": 0-100 score,
  "breakdown": {
    "balance": 0-100 (political balance of sources),
    "sourceQuality": 0-100 (based on credibility scores),
    "clarity": 0-100 (how clear and accessible),
    "completeness": 0-100 (coverage of key aspects)
  },
  "notes": ["brief notes on strengths/weaknesses"]
}`
    }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      overall: 75,
      breakdown: { balance: 75, sourceQuality: 75, clarity: 75, completeness: 75 },
      notes: ['Unable to parse scoring response'],
    };
  }

  return JSON.parse(jsonMatch[0]) as ClarityScore;
}

function createStreamingBriefGenerationGraph() {
  const graph = new StateGraph(StreamingStateAnnotation)
    .addNode("research_agent", researchNode)
    .addNode("classify_agent", classificationNode)
    .addNode("structure_agent", structureNode)
    .addNode("narrative_agent", narrativeNode)
    .addNode("reconcile_agent", reconciliationNode)
    .addNode("summary_child", summaryChildNode)
    .addNode("summary_teen", summaryTeenNode)
    .addNode("summary_undergrad", summaryUndergradNode)
    .addNode("summary_postdoc", summaryPostdocNode)
    .addNode("clarity_agent", clarityScoringNode)
    .addEdge(START, "research_agent")
    .addEdge("research_agent", "classify_agent")
    .addEdge("classify_agent", "structure_agent")
    .addEdge("classify_agent", "narrative_agent")
    .addEdge("structure_agent", "reconcile_agent")
    .addEdge("narrative_agent", "reconcile_agent")
    .addEdge("reconcile_agent", "summary_child")
    .addEdge("reconcile_agent", "summary_teen")
    .addEdge("reconcile_agent", "summary_undergrad")
    .addEdge("reconcile_agent", "summary_postdoc")
    .addEdge("summary_child", "clarity_agent")
    .addEdge("summary_teen", "clarity_agent")
    .addEdge("summary_undergrad", "clarity_agent")
    .addEdge("summary_postdoc", "clarity_agent")
    .addEdge("clarity_agent", END);

  return graph.compile();
}

export async function generateBriefWithEvents(
  question: string,
  briefId: string,
  callbacks: GenerationCallbacks
): Promise<StreamingState> {
  console.log(`[StreamingOrchestrator] Starting brief generation for: "${question}"`);
  const startTime = Date.now();

  const graph = createStreamingBriefGenerationGraph();

  const initialState: Partial<StreamingState> = {
    question,
    briefId,
    callbacks,
    sources: [],
    classification: null,
    persona: null,
    structure: null,
    narrative: null,
    reconciliation: null,
    summaries: {},
    clarityScore: null,
    error: null,
    completedSteps: [],
  };

  try {
    const result = await graph.invoke(initialState);
    const duration = Date.now() - startTime;

    console.log(`[StreamingOrchestrator] Brief generation completed in ${duration}ms`);

    if (result.briefId && !result.error) {
      completeBriefGeneration(result.briefId, result as any, duration).catch((err) => {
        console.error('[StreamingOrchestrator] Failed to save completed brief:', err);
      });
    }

    return result as StreamingState;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[StreamingOrchestrator] Brief generation failed after ${duration}ms:`, error);

    callbacks.onError(error instanceof Error ? error.message : String(error));

    return {
      ...initialState,
      error: error instanceof Error ? error.message : String(error),
    } as StreamingState;
  }
}
