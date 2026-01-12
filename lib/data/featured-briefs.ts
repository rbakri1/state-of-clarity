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

  // UK Policy Briefs (January 2026)
  {
    id: "uk-council-tax-reform",
    question: "How should the UK reform council tax to make it more progressive?",
    excerpt: "Council tax bands haven't been updated since 1991, creating a system where the poorest pay 4.8% of income versus 1.6% for the richest. Reform options range from revaluation to land value tax, but 18 million properties would see increases.",
    clarity_score: 8.2,
    tags: ["Taxation", "UK Policy"],
    readTime: "6 min",
  },
  {
    id: "uk-proportional-representation",
    question: "Should the UK adopt proportional representation instead of first-past-the-post?",
    excerpt: "In 2024, Labour won 63% of seats with 34% of votes, while Reform UK got 14% of votes but 1% of seats. PR would make representation fairer but typically produces coalition governments—Germany averages 4-party coalitions.",
    clarity_score: 8.4,
    tags: ["Electoral Reform", "Democracy"],
    readTime: "7 min",
  },

  // US Policy Briefs (January 2026)
  {
    id: "us-federal-wealth-tax",
    question: "Should the United States implement a federal wealth tax?",
    excerpt: "A 2% wealth tax on fortunes above $50M could raise $250-400 billion annually. But enforcement challenges are severe: wealthy Americans can hide assets offshore or renounce citizenship—France's wealth tax raised less than predicted before repeal.",
    clarity_score: 8.0,
    tags: ["Taxation", "US Policy"],
    readTime: "7 min",
  },
  {
    id: "us-qualified-immunity",
    question: "What would be the effects of ending qualified immunity for police officers?",
    excerpt: "Qualified immunity shields police from civil lawsuits unless they violate 'clearly established' rights. Ending it could increase accountability for misconduct but may also drive officers from the profession and raise city liability insurance costs.",
    clarity_score: 8.1,
    tags: ["Criminal Justice", "Police Reform"],
    readTime: "6 min",
  },
  {
    id: "brief-007-us-assault-weapons-ban",
    question: "Should the US ban assault weapons nationwide?",
    excerpt: "Assault weapons account for ~3% of US gun deaths but feature prominently in mass shootings. The 1994-2004 federal ban showed mixed results—some studies find reduced mass shooting deaths, others find no significant overall impact.",
    clarity_score: 8.5,
    tags: ["Gun Policy", "Public Safety"],
    readTime: "7 min",
  },
  {
    id: "medicare-for-all",
    question: "How would Medicare for All impact the US healthcare system and economy?",
    excerpt: "Single-payer could save $450 billion annually through administrative efficiency and drug negotiation. But transition costs are enormous: 1.8 million insurance jobs eliminated, and tax increases of $16 trillion needed over 10 years.",
    clarity_score: 8.8,
    tags: ["Healthcare", "US Policy"],
    readTime: "9 min",
  },

  // More briefs coming soon
  // Next: International relations, technology, climate
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
