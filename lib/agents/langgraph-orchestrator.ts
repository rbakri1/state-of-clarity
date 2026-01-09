/**
 * LangGraph Orchestrator
 *
 * Orchestrates the brief generation pipeline with parallel execution support.
 * Pipeline: Research → Classification → [Structure || Narrative] → Reconciliation → [4x Summary] → Clarity Scoring
 */

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import type { QuestionClassification } from "../types/classification";
import type { Source } from "./research-agent";
import type { SpecialistPersona } from "./specialist-personas";
import type { ReadingLevel } from "./summary-prompts";
import { researchAgent } from "./research-agent";
import { classifyQuestion } from "./question-classifier";
import { getSpecialistPersona } from "./specialist-personas";
import { getSummaryPrompt, getAllReadingLevels } from "./summary-prompts";
import { withRetry } from "./retry-wrapper";
import { executeWithLogging, ExecutionContext } from "./execution-logger";

export interface StructureOutput {
  factors: Array<{
    name: string;
    description: string;
    stakeholders: string[];
    impact: string;
  }>;
  policies: Array<{
    name: string;
    description: string;
    proponents: string[];
    opponents: string[];
    tradeoffs: string;
  }>;
  timeline?: Array<{
    date: string;
    event: string;
    significance: string;
  }>;
}

export interface NarrativeOutput {
  introduction: string;
  mainBody: string;
  conclusion: string;
  keyTakeaways: string[];
}

export interface ReconciliationOutput {
  reconciledNarrative: NarrativeOutput;
  changes: string[];
  isConsistent: boolean;
}

export interface SummaryOutputs {
  child: string;
  teen: string;
  undergrad: string;
  postdoc: string;
}

export interface ClarityScore {
  overall: number;
  breakdown: {
    balance: number;
    sourceQuality: number;
    clarity: number;
    completeness: number;
  };
  notes: string[];
}

export const BriefStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  briefId: Annotation<string | null>(),
  
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

export type BriefState = typeof BriefStateAnnotation.State;

function getExecutionContext(state: BriefState, mode: 'parallel' | 'sequential', parallelGroup?: string): ExecutionContext {
  return {
    briefId: state.briefId,
    executionMode: mode,
    parallelGroup,
  };
}

async function researchNode(state: BriefState): Promise<Partial<BriefState>> {
  console.log('[Orchestrator] Starting Research node');
  
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
  
  return {
    sources,
    completedSteps: ['research'],
  };
}

async function classificationNode(state: BriefState): Promise<Partial<BriefState>> {
  console.log('[Orchestrator] Starting Classification node');
  
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
  
  return {
    classification,
    persona,
    completedSteps: ['classification'],
  };
}

async function structureNode(state: BriefState): Promise<Partial<BriefState>> {
  const startTime = Date.now();
  console.log('[Orchestrator] Starting Structure node (parallel with Narrative)');
  
  const context = getExecutionContext(state, 'parallel', 'structure-narrative');
  
  const structure = await executeWithLogging(
    'Structure Agent',
    () => withRetry(
      () => generateStructure(state),
      { agentName: 'Structure Agent' }
    ),
    context
  );
  
  const duration = Date.now() - startTime;
  console.log(`[Orchestrator] Structure Agent completed in ${duration}ms (running parallel with Narrative)`);
  
  return {
    structure,
    completedSteps: ['structure'],
  };
}

async function narrativeNode(state: BriefState): Promise<Partial<BriefState>> {
  const startTime = Date.now();
  console.log('[Orchestrator] Starting Narrative node (parallel with Structure)');
  
  const context = getExecutionContext(state, 'parallel', 'structure-narrative');
  
  const narrative = await executeWithLogging(
    'Narrative Agent',
    () => withRetry(
      () => generateNarrative(state),
      { agentName: 'Narrative Agent' }
    ),
    context
  );
  
  const duration = Date.now() - startTime;
  console.log(`[Orchestrator] Narrative Agent completed in ${duration}ms (running parallel with Structure)`);
  
  return {
    narrative,
    completedSteps: ['narrative'],
  };
}

async function reconciliationNode(state: BriefState): Promise<Partial<BriefState>> {
  console.log('[Orchestrator] Starting Reconciliation node');
  
  const context = getExecutionContext(state, 'sequential');
  
  const reconciliation = await executeWithLogging(
    'Reconciliation Agent',
    () => withRetry(
      () => reconcileOutputs(state),
      { agentName: 'Reconciliation Agent' }
    ),
    context
  );
  
  return {
    reconciliation,
    narrative: reconciliation.reconciledNarrative,
    completedSteps: ['reconciliation'],
  };
}

async function summaryChildNode(state: BriefState): Promise<Partial<BriefState>> {
  console.log('[Orchestrator] Starting Summary Child node (parallel)');
  
  const context = getExecutionContext(state, 'parallel', 'summaries');
  
  const summary = await executeWithLogging(
    'Summary Agent (Child)',
    () => withRetry(
      () => generateSummary(state, 'child'),
      { agentName: 'Summary Agent (Child)' }
    ),
    context
  );
  
  return {
    summaries: { child: summary },
    completedSteps: ['summary-child'],
  };
}

async function summaryTeenNode(state: BriefState): Promise<Partial<BriefState>> {
  console.log('[Orchestrator] Starting Summary Teen node (parallel)');
  
  const context = getExecutionContext(state, 'parallel', 'summaries');
  
  const summary = await executeWithLogging(
    'Summary Agent (Teen)',
    () => withRetry(
      () => generateSummary(state, 'teen'),
      { agentName: 'Summary Agent (Teen)' }
    ),
    context
  );
  
  return {
    summaries: { teen: summary },
    completedSteps: ['summary-teen'],
  };
}

async function summaryUndergradNode(state: BriefState): Promise<Partial<BriefState>> {
  console.log('[Orchestrator] Starting Summary Undergrad node (parallel)');
  
  const context = getExecutionContext(state, 'parallel', 'summaries');
  
  const summary = await executeWithLogging(
    'Summary Agent (Undergrad)',
    () => withRetry(
      () => generateSummary(state, 'undergrad'),
      { agentName: 'Summary Agent (Undergrad)' }
    ),
    context
  );
  
  return {
    summaries: { undergrad: summary },
    completedSteps: ['summary-undergrad'],
  };
}

async function summaryPostdocNode(state: BriefState): Promise<Partial<BriefState>> {
  console.log('[Orchestrator] Starting Summary Postdoc node (parallel)');
  
  const context = getExecutionContext(state, 'parallel', 'summaries');
  
  const summary = await executeWithLogging(
    'Summary Agent (Postdoc)',
    () => withRetry(
      () => generateSummary(state, 'postdoc'),
      { agentName: 'Summary Agent (Postdoc)' }
    ),
    context
  );
  
  return {
    summaries: { postdoc: summary },
    completedSteps: ['summary-postdoc'],
  };
}

async function clarityScoringNode(state: BriefState): Promise<Partial<BriefState>> {
  console.log('[Orchestrator] Starting Clarity Scoring node');
  
  const context = getExecutionContext(state, 'sequential');
  
  const clarityScore = await executeWithLogging(
    'Clarity Scoring Agent',
    () => withRetry(
      () => scoreClarityInternal(state),
      { agentName: 'Clarity Scoring Agent' }
    ),
    context
  );
  
  return {
    clarityScore,
    completedSteps: ['clarity-scoring'],
  };
}

async function generateStructure(state: BriefState): Promise<StructureOutput> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const sourceSummary = state.sources.slice(0, 10).map(s => 
    `- ${s.title} (${s.publisher}, ${s.political_lean}): ${s.content.slice(0, 200)}...`
  ).join('\n');
  
  const personaContext = state.persona 
    ? `You are ${state.persona.name}. ${state.persona.systemPrompt}` 
    : 'You are a policy analyst.';
  
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
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
  "factors": [
    {
      "name": "Factor name",
      "description": "Brief description",
      "stakeholders": ["list", "of", "stakeholders"],
      "impact": "Description of impact"
    }
  ],
  "policies": [
    {
      "name": "Policy name",
      "description": "Brief description",
      "proponents": ["list", "of", "proponents"],
      "opponents": ["list", "of", "opponents"],
      "tradeoffs": "Description of tradeoffs"
    }
  ],
  "timeline": [
    {
      "date": "Date or period",
      "event": "What happened",
      "significance": "Why it matters"
    }
  ]
}

Include 3-5 factors, 2-4 policies, and 3-6 timeline events.`
    }],
  });
  
  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Structure Agent response");
  }
  
  return JSON.parse(jsonMatch[0]) as StructureOutput;
}

async function generateNarrative(state: BriefState): Promise<NarrativeOutput> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const sourceSummary = state.sources.slice(0, 10).map(s => 
    `- ${s.title} (${s.publisher}, ${s.political_lean}): ${s.content.slice(0, 200)}...`
  ).join('\n');
  
  const personaContext = state.persona 
    ? `You are ${state.persona.name}. ${state.persona.systemPrompt}` 
    : 'You are a policy analyst.';
  
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
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

async function reconcileOutputs(state: BriefState): Promise<ReconciliationOutput> {
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
  
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const message = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Compare these two outputs and identify any inconsistencies.

STRUCTURE (Source of Truth):
${JSON.stringify(state.structure, null, 2)}

NARRATIVE:
${JSON.stringify(state.narrative, null, 2)}

Check:
1. Do all factors in the Narrative appear in the Structure table?
2. Do all policies mentioned align?
3. Are there any contradictory statements?

If inconsistencies exist, provide a corrected narrative that aligns with the Structure.

Return a JSON object:
{
  "isConsistent": boolean,
  "changes": ["List of changes made, or empty if consistent"],
  "reconciledNarrative": {
    "introduction": "...",
    "mainBody": "...",
    "conclusion": "...",
    "keyTakeaways": ["..."]
  }
}

If the narrative is already consistent, return it unchanged in reconciledNarrative.`
    }],
  });
  
  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      reconciledNarrative: state.narrative,
      changes: [],
      isConsistent: true,
    };
  }
  
  return JSON.parse(jsonMatch[0]) as ReconciliationOutput;
}

async function generateSummary(state: BriefState, level: ReadingLevel): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const prompt = getSummaryPrompt(level);
  
  const structureContext = state.structure 
    ? `Key Factors: ${state.structure.factors.map(f => f.name).join(', ')}\nPolicies: ${state.structure.policies.map(p => p.name).join(', ')}`
    : '';
  
  const narrativeContext = state.narrative
    ? `${state.narrative.introduction}\n\n${state.narrative.mainBody}`
    : '';
  
  const message = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
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

async function scoreClarityInternal(state: BriefState): Promise<ClarityScore> {
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
    model: "claude-3-5-haiku-20241022",
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

export function createBriefGenerationGraph() {
  const graph = new StateGraph(BriefStateAnnotation)
    .addNode("research", researchNode)
    .addNode("classification", classificationNode)
    .addNode("structure", structureNode)
    .addNode("narrative", narrativeNode)
    .addNode("reconciliation", reconciliationNode)
    .addNode("summary_child", summaryChildNode)
    .addNode("summary_teen", summaryTeenNode)
    .addNode("summary_undergrad", summaryUndergradNode)
    .addNode("summary_postdoc", summaryPostdocNode)
    .addNode("clarity_scoring", clarityScoringNode)
    .addEdge(START, "research")
    .addEdge("research", "classification")
    .addEdge("classification", "structure")
    .addEdge("classification", "narrative")
    .addEdge("structure", "reconciliation")
    .addEdge("narrative", "reconciliation")
    .addEdge("reconciliation", "summary_child")
    .addEdge("reconciliation", "summary_teen")
    .addEdge("reconciliation", "summary_undergrad")
    .addEdge("reconciliation", "summary_postdoc")
    .addEdge("summary_child", "clarity_scoring")
    .addEdge("summary_teen", "clarity_scoring")
    .addEdge("summary_undergrad", "clarity_scoring")
    .addEdge("summary_postdoc", "clarity_scoring")
    .addEdge("clarity_scoring", END);
  
  return graph.compile();
}

export async function generateBrief(question: string, briefId?: string): Promise<BriefState> {
  console.log(`[Orchestrator] Starting brief generation for: "${question}"`);
  const startTime = Date.now();
  
  const graph = createBriefGenerationGraph();
  
  const initialState: Partial<BriefState> = {
    question,
    briefId: briefId || null,
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
    
    console.log(`[Orchestrator] Brief generation completed in ${duration}ms`);
    console.log(`[Orchestrator] Completed steps: ${result.completedSteps?.join(', ')}`);
    
    return result as BriefState;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Orchestrator] Brief generation failed after ${duration}ms:`, error);
    
    return {
      ...initialState,
      error: error instanceof Error ? error.message : String(error),
    } as BriefState;
  }
}

export { getAllReadingLevels };
