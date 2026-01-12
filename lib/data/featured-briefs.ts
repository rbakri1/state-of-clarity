/**
 * Featured briefs with excerpts for homepage rotation.
 * These are high-quality completed briefs that showcase State of Clarity's analysis.
 * Only includes briefs that actually exist (sample files or database).
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
  // Foundational briefs (sample files)
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
  {
    id: "medicare-for-all",
    question: "How would Medicare for All impact the US healthcare system and economy?",
    excerpt: "Single-payer could save $450 billion annually through administrative efficiency and drug negotiation. But transition costs are enormous: 1.8 million insurance jobs eliminated, and tax increases of $16 trillion needed over 10 years.",
    clarity_score: 8.8,
    tags: ["Healthcare", "US Policy"],
    readTime: "9 min",
  },
  {
    id: "uk-ban-conversion-therapy",
    question: "Should the UK ban conversion therapy?",
    excerpt: "Medical consensus condemns conversion therapy as harmful and ineffective, but defining its boundaries remains contested. The key tension: protecting LGBTQ+ individuals while preserving legitimate therapeutic and religious practices.",
    clarity_score: 8.3,
    tags: ["LGBTQ+ Rights", "UK Policy"],
    readTime: "6 min",
  },
  {
    id: "uk-mandatory-voting",
    question: "Should the UK introduce mandatory voting?",
    excerpt: "Australia's compulsory voting achieves 90%+ turnout, but critics argue it conflicts with democratic freedom. The debate centers on whether low turnout reflects apathy to be corrected or legitimate political expression to be respected.",
    clarity_score: 8.1,
    tags: ["Democracy", "Electoral Reform"],
    readTime: "5 min",
  },
  {
    id: "uk-rent-controls",
    question: "Should the UK introduce rent controls?",
    excerpt: "Rent controls provide immediate relief for current tenants but economic evidence consistently shows they reduce housing supply long-term. The challenge is balancing short-term affordability with housing investment incentives.",
    clarity_score: 8.0,
    tags: ["Housing", "UK Policy"],
    readTime: "6 min",
  },
  {
    id: "scottish-independence-economics",
    question: "What would Scottish independence mean for the economy?",
    excerpt: "An independent Scotland would face significant fiscal challenges: a £15bn deficit, currency uncertainty, and trade barriers with England. But proponents argue EU membership and oil revenues could offset these costs over time.",
    clarity_score: 8.4,
    tags: ["Scotland", "Economics"],
    readTime: "8 min",
  },
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
  const shuffled = [...FEATURED_BRIEFS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(4, FEATURED_BRIEFS.length));
}
