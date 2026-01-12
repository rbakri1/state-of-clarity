/**
 * Showcase briefs for the homepage.
 * Only includes briefs that actually exist (sample files or database).
 */

export interface ShowcaseBrief {
  id: string;
  question: string;
  clarity_score: number;
  tags: string[];
  readTime: string;
}

export const SHOWCASE_BRIEFS: ShowcaseBrief[] = [
  // Sample briefs that exist
  {
    id: "what-is-a-state",
    question: "What is a state?",
    clarity_score: 8.7,
    tags: ["Foundational", "Political Philosophy"],
    readTime: "4 min",
  },
  {
    id: "uk-four-day-week",
    question: "What would be the impacts of a 4-day work week in the UK?",
    clarity_score: 8.4,
    tags: ["Economics", "Labor Policy"],
    readTime: "6 min",
  },
  {
    id: "medicare-for-all",
    question: "How would Medicare for All impact the US healthcare system and economy?",
    clarity_score: 8.8,
    tags: ["Healthcare", "US Policy"],
    readTime: "9 min",
  },
  {
    id: "uk-ban-conversion-therapy",
    question: "Should the UK ban conversion therapy?",
    clarity_score: 8.3,
    tags: ["LGBTQ+ Rights", "UK Policy"],
    readTime: "6 min",
  },
  {
    id: "uk-mandatory-voting",
    question: "Should the UK introduce mandatory voting?",
    clarity_score: 8.1,
    tags: ["Democracy", "Electoral Reform"],
    readTime: "5 min",
  },
  {
    id: "uk-rent-controls",
    question: "Should the UK introduce rent controls?",
    clarity_score: 8.0,
    tags: ["Housing", "UK Policy"],
    readTime: "6 min",
  },
  {
    id: "scottish-independence-economics",
    question: "What would Scottish independence mean for the economy?",
    clarity_score: 8.4,
    tags: ["Scotland", "Economics"],
    readTime: "8 min",
  },
];

/**
 * Get a random selection of showcase briefs
 */
export function getRandomShowcaseBriefs(count: number = 6): ShowcaseBrief[] {
  const shuffled = [...SHOWCASE_BRIEFS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get featured briefs (always include the first two plus random others)
 */
export function getFeaturedBriefs(): ShowcaseBrief[] {
  const featured = SHOWCASE_BRIEFS.slice(0, 2);
  const others = SHOWCASE_BRIEFS.slice(2);
  const randomOthers = others.sort(() => Math.random() - 0.5).slice(0, 4);
  return [...featured, ...randomOthers];
}
