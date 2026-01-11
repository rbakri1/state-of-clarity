/**
 * Question Classifier Agent
 *
 * Classifies policy questions to enable:
 * - Routing to specialist agent personas
 * - Optimized source selection
 * - Appropriate controversy handling
 *
 * Uses Claude Haiku for cost efficiency (~£0.001 per classification)
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  QuestionClassification,
  Domain,
  ControversyLevel,
  QuestionType,
  TemporalScope,
} from "../types/classification";

const CLASSIFICATION_PROMPT = `You are an expert at classifying policy questions. Analyze the given question and return a JSON classification.

## Classification Categories

### Domain (pick the PRIMARY domain if question spans multiple):
- economics: GDP, inflation, taxation, trade, employment, markets, fiscal/monetary policy
- healthcare: NHS, public health, pharmaceuticals, mental health, healthcare funding
- climate: Environment, emissions, renewable energy, sustainability, biodiversity
- education: Schools, universities, curriculum, student loans, research funding
- defense: Military, national security, NATO, defense spending, armed forces
- immigration: Borders, visas, asylum, citizenship, migration policy
- housing: Property, rent, homelessness, planning, construction
- justice: Courts, police, prisons, crime, legal reform, civil liberties
- technology: AI, digital policy, cybersecurity, tech regulation, data privacy
- governance: Elections, constitutional matters, devolution, parliamentary procedure
- other: Questions not fitting above categories

### Controversy Level:
- low: Factual questions with widely accepted answers (e.g., "What is GDP?")
- medium: Policy questions with legitimate debate (e.g., "Should UK adopt 4-day work week?")
- high: Deeply divisive issues with strong opposing views (e.g., "Should UK rejoin the EU?")

### Question Type:
- factual: Seeking facts, data, or definitions (e.g., "What is the current inflation rate?")
- analytical: Seeking explanation of causes/effects (e.g., "Why did inflation rise in 2022?")
- opinion: Seeking normative judgment (e.g., "Should we raise interest rates?")
- comparative: Comparing options/approaches (e.g., "How does UK healthcare compare to France?")

### Temporal Scope:
- historical: About past events (e.g., "What caused the 2008 financial crisis?")
- current: About present situation (e.g., "What is the current unemployment rate?")
- future: About predictions/projections (e.g., "Will AI replace most jobs?")
- timeless: Conceptual/theoretical (e.g., "How does inflation affect purchasing power?")

## Examples

Question: "What is the UK's current GDP?"
{"domain": "economics", "controversyLevel": "low", "questionType": "factual", "temporalScope": "current"}

Question: "Should the UK rejoin the European Union?"
{"domain": "governance", "controversyLevel": "high", "questionType": "opinion", "temporalScope": "current"}

Question: "Why did NHS waiting times increase after COVID?"
{"domain": "healthcare", "controversyLevel": "medium", "questionType": "analytical", "temporalScope": "historical"}

Question: "How does UK immigration policy compare to Australia's points system?"
{"domain": "immigration", "controversyLevel": "medium", "questionType": "comparative", "temporalScope": "timeless"}

Question: "Will AI regulation stifle UK tech innovation?"
{"domain": "technology", "controversyLevel": "medium", "questionType": "opinion", "temporalScope": "future"}

Question: "What caused the 2008 financial crisis?"
{"domain": "economics", "controversyLevel": "low", "questionType": "analytical", "temporalScope": "historical"}

Question: "Should the UK implement a universal basic income?"
{"domain": "economics", "controversyLevel": "high", "questionType": "opinion", "temporalScope": "future"}

Question: "How do renewable energy subsidies affect electricity prices?"
{"domain": "climate", "controversyLevel": "medium", "questionType": "analytical", "temporalScope": "timeless"}

Question: "What is the legal status of assisted dying in the UK?"
{"domain": "justice", "controversyLevel": "medium", "questionType": "factual", "temporalScope": "current"}

Question: "Should university tuition fees be abolished?"
{"domain": "education", "controversyLevel": "high", "questionType": "opinion", "temporalScope": "current"}

## Instructions

Analyze the question below and return ONLY a JSON object with these exact fields:
- domain: one of the domain values listed above
- controversyLevel: "low", "medium", or "high"
- questionType: "factual", "analytical", "opinion", or "comparative"
- temporalScope: "historical", "current", "future", or "timeless"

If a question spans multiple domains, pick the PRIMARY domain that best represents the core focus.

Question: {{QUESTION}}`;

/**
 * Classify a policy question to determine domain, controversy level,
 * question type, and temporal scope.
 *
 * @param question - The policy question to classify
 * @returns Classification object with domain, controversyLevel, questionType, temporalScope
 */
export async function classifyQuestion(question: string): Promise<QuestionClassification> {
  console.log(`[Question Classifier] Classifying: "${question}"`);

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = CLASSIFICATION_PROMPT.replace("{{QUESTION}}", question);

  const message = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const classification: QuestionClassification = {
    domain: validateDomain(parsed.domain),
    controversyLevel: validateControversyLevel(parsed.controversyLevel),
    questionType: validateQuestionType(parsed.questionType),
    temporalScope: validateTemporalScope(parsed.temporalScope),
  };

  console.log(`[Question Classifier] Result:`, classification);

  return classification;
}

function validateDomain(value: string): Domain {
  const validDomains: Domain[] = [
    "economics",
    "healthcare",
    "climate",
    "education",
    "defense",
    "immigration",
    "housing",
    "justice",
    "technology",
    "governance",
    "other",
  ];
  if (validDomains.includes(value as Domain)) {
    return value as Domain;
  }
  console.warn(`[Question Classifier] Invalid domain "${value}", defaulting to "other"`);
  return "other";
}

function validateControversyLevel(value: string): ControversyLevel {
  const validLevels: ControversyLevel[] = ["low", "medium", "high"];
  if (validLevels.includes(value as ControversyLevel)) {
    return value as ControversyLevel;
  }
  console.warn(`[Question Classifier] Invalid controversyLevel "${value}", defaulting to "medium"`);
  return "medium";
}

function validateQuestionType(value: string): QuestionType {
  const validTypes: QuestionType[] = ["factual", "analytical", "opinion", "comparative"];
  if (validTypes.includes(value as QuestionType)) {
    return value as QuestionType;
  }
  console.warn(`[Question Classifier] Invalid questionType "${value}", defaulting to "analytical"`);
  return "analytical";
}

function validateTemporalScope(value: string): TemporalScope {
  const validScopes: TemporalScope[] = ["historical", "current", "future", "timeless"];
  if (validScopes.includes(value as TemporalScope)) {
    return value as TemporalScope;
  }
  console.warn(`[Question Classifier] Invalid temporalScope "${value}", defaulting to "current"`);
  return "current";
}
