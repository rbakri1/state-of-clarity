export type ReadingLevel = "child" | "teen" | "undergrad" | "postdoc";

export type GenerationStage =
  | "research"
  | "structure"
  | "summary"
  | "narrative"
  | "scoring";

export interface GenerationProgress {
  currentStage: GenerationStage;
  progress: number; // 0-100
  estimatedSecondsRemaining: number;
}

export type PoliticalLean =
  | "left"
  | "center-left"
  | "center"
  | "center-right"
  | "right"
  | "unknown";

export interface Source {
  id: string;
  url: string;
  title: string;
  author?: string;
  political_lean: PoliticalLean;
  credibility_score: number;
  source_type: "primary" | "secondary" | "tertiary";
  is_paywalled?: boolean;
  published_at?: string;
  publication_date?: string;
}

export interface ReadingLevelSummary {
  level: ReadingLevel;
  content: string;
  word_count: number;
  reading_time_minutes: number;
}

export interface ClarityScore {
  overall: number;
  dimensions: {
    first_principles: number;
    internal_consistency: number;
    evidence_quality: number;
    accessibility: number;
    objectivity: number;
  };
  critique: string;
}

export interface Brief {
  id: string;
  question: string;
  summaries: ReadingLevelSummary[] | Record<ReadingLevel, string>;
  narrative: string;
  structured_data: StructuredData;
  clarity_score: ClarityScore | number | null;
  sources: Source[];
  created_at: string;
  updated_at: string;
  version?: number;
  view_count?: number;
  is_public?: boolean;
  metadata?: {
    tags?: string[];
    sources?: Source[];
    [key: string]: unknown;
  };
  clarity_critique?: {
    score: number;
    breakdown: Record<string, number>;
    strengths: string[];
    gaps: string[];
  } | null;
  posit?: {
    question: string;
    relevance: string;
  } | null;
  historical_summary?: {
    introduction: string;
    origins: string;
    key_milestones: string[];
    modern_context: string;
    lessons: string[];
  } | null;
  foundational_principles?: {
    enabled: boolean;
    principles: Array<{
      rank: number;
      name: string;
      definition: string;
      justification: string;
    }>;
    ranking_rationale: string;
  } | null;
}

export interface StructuredData {
  definitions?: Array<{
    term: string;
    definition: string;
    source?: string;
    points_of_contention?: string;
  }>;
  factors?: Array<{
    name: string;
    impact: string;
    evidence: string[];
  }>;
  policies?: Array<{
    name: string;
    pros: string[];
    cons: string[];
  }>;
  consequences?: Array<{
    action: string;
    first_order: string;
    second_order: string;
  }>;
  sources?: Source[];
}
