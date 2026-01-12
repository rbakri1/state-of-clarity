/**
 * Featured briefs with excerpts for homepage rotation.
 * These are high-quality completed briefs that showcase State of Clarity's analysis.
 * Updated January 2026.
 */

export interface FeaturedBrief {
  id: string;
  question: string;
  excerpt: string; // 2-3 sentence summary of the key insight
  clarity_score: number;
  tags: string[];
  readTime: string;
}

export const FEATURED_BRIEFS: FeaturedBrief[] = [
  // Foundational briefs
  {
    id: "what-is-a-state",
    question: "What is a state?",
    excerpt: "The state is not natural, neutral, or inevitable—but ubiquitous for contingent reasons. It emerged through coercion and conflict, justified itself through contested theories, and persists because no alternative has reliably provided security and public goods at scale.",
    clarity_score: 8.7,
    tags: ["Foundational", "Political Philosophy"],
    readTime: "4 min",
  },
  {
    id: "uk-four-day-week",
    question: "What would be the impacts of a 4-day work week in the UK?",
    excerpt: "UK trials show 92% of companies maintained revenue with 20% fewer hours, while worker burnout dropped 71%. But the policy faces challenges in healthcare, manufacturing, and retail where hours directly correlate with output.",
    clarity_score: 8.4,
    tags: ["Economics", "Labor Policy"],
    readTime: "6 min",
  },

  // Completed seed briefs (January 2026)
  {
    id: "uk-mandatory-voting",
    question: "Should the UK implement mandatory voting like Australia?",
    excerpt: "Australia achieves 95%+ turnout with modest fines, narrowing class-based participation gaps. But compulsory voting raises fundamental questions: is voting a right that includes non-exercise, or a civic duty that justifies mild coercion?",
    clarity_score: 8.3,
    tags: ["Democracy", "Electoral Reform"],
    readTime: "7 min",
  },
  {
    id: "uk-ban-conversion-therapy",
    question: "Should the UK ban conversion therapy for LGBTQ+ individuals?",
    excerpt: "Over 50 countries ban conversion therapy based on medical consensus that it's harmful and ineffective. Yet debates persist over religious freedom, parental rights, and whether talk therapy for gender dysphoria should be exempted.",
    clarity_score: 8.1,
    tags: ["LGBTQ+ Rights", "Healthcare"],
    readTime: "6 min",
  },
  {
    id: "uk-scotland-independence-economics",
    question: "What would be the economic impacts of Scotland leaving the UK?",
    excerpt: "Scotland faces a fiscal deficit of 8.6% of GDP, triple the UK average. Independence would require either sharp spending cuts, tax rises, or currency instability—unless North Sea oil revenues surge or EU membership brings substantial fiscal transfers.",
    clarity_score: 8.2,
    tags: ["Scotland", "Economics"],
    readTime: "8 min",
  },
  {
    id: "uk-rent-controls",
    question: "Should the UK implement rent controls to address housing affordability?",
    excerpt: "Rent controls reduce housing costs for current tenants but decrease new rental supply by 15-25% according to cross-national evidence. The policy treats symptoms of housing shortage while potentially worsening the underlying scarcity.",
    clarity_score: 7.9,
    tags: ["Housing", "UK Policy"],
    readTime: "7 min",
  },


  // More briefs will be added as content library grows
  // Future topics: US policy, international relations, technology, climate
];

/**
 * Get a random selection of featured briefs for homepage rotation
 */
export function getRandomFeaturedBriefs(count: number = 3): FeaturedBrief[] {
  const shuffled = [...FEATURED_BRIEFS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get rotating featured briefs (changes on each page load)
 */
export function getRotatingFeaturedBriefs(): FeaturedBrief[] {
  // Show 4 random briefs from the full collection
  // This ensures variety while keeping foundational briefs in rotation
  const shuffled = [...FEATURED_BRIEFS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(4, FEATURED_BRIEFS.length));
}
