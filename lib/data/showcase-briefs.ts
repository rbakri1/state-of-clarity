/**
 * Showcase briefs for the homepage.
 * These represent the range of topics covered by State of Clarity.
 * Updated to reflect current affairs in UK and USA (January 2026).
 */

export interface ShowcaseBrief {
  id: string;
  question: string;
  clarity_score: number;
  tags: string[];
  readTime: string;
}

export const SHOWCASE_BRIEFS: ShowcaseBrief[] = [
  // Foundational / Political Philosophy
  {
    id: "what-is-a-state",
    question: "What is a state?",
    clarity_score: 8.7,
    tags: ["Foundational", "Political Philosophy", "First Principles"],
    readTime: "4 min",
  },
  {
    id: "uk-four-day-week",
    question: "What would be the impacts of a 4-day work week in the UK?",
    clarity_score: 8.4,
    tags: ["Economics", "Labor Policy", "Wellbeing"],
    readTime: "6 min",
  },

  // UK Current Affairs
  {
    id: "uk-nhs-funding-crisis",
    question: "How should the NHS address its funding and staffing crisis?",
    clarity_score: 8.2,
    tags: ["Healthcare", "UK Policy", "Public Services"],
    readTime: "7 min",
  },
  {
    id: "uk-housing-crisis",
    question: "What policies could solve the UK housing crisis?",
    clarity_score: 8.1,
    tags: ["Housing", "UK Policy", "Economics"],
    readTime: "6 min",
  },
  {
    id: "uk-net-zero-2050",
    question: "Can the UK realistically achieve net zero by 2050?",
    clarity_score: 7.9,
    tags: ["Climate", "UK Policy", "Energy"],
    readTime: "8 min",
  },
  {
    id: "uk-single-market-rejoin",
    question: "Should the UK rejoin the EU single market?",
    clarity_score: 8.5,
    tags: ["Brexit", "Trade", "UK-EU Relations"],
    readTime: "7 min",
  },
  {
    id: "uk-immigration-points",
    question: "How effective is the UK's points-based immigration system?",
    clarity_score: 7.8,
    tags: ["Immigration", "UK Policy", "Labor Market"],
    readTime: "6 min",
  },
  {
    id: "uk-house-lords-reform",
    question: "Should the House of Lords be abolished or reformed?",
    clarity_score: 8.3,
    tags: ["Constitutional", "UK Politics", "Democracy"],
    readTime: "5 min",
  },
  {
    id: "uk-wealth-tax",
    question: "Would a wealth tax work in the UK?",
    clarity_score: 8.0,
    tags: ["Taxation", "Inequality", "Economics"],
    readTime: "6 min",
  },
  {
    id: "uk-social-care-reform",
    question: "How should the UK reform its social care system?",
    clarity_score: 7.7,
    tags: ["Social Care", "Aging", "UK Policy"],
    readTime: "7 min",
  },
  {
    id: "uk-private-schools-tax",
    question: "Should private schools lose their charitable status?",
    clarity_score: 8.1,
    tags: ["Education", "Taxation", "Inequality"],
    readTime: "5 min",
  },
  {
    id: "scottish-independence-economics",
    question: "What would Scottish independence mean for the economy?",
    clarity_score: 8.4,
    tags: ["Scotland", "Economics", "Constitutional"],
    readTime: "8 min",
  },

  // USA Current Affairs
  {
    id: "us-universal-healthcare",
    question: "Could the US adopt universal healthcare?",
    clarity_score: 8.3,
    tags: ["Healthcare", "US Policy", "Economics"],
    readTime: "8 min",
  },
  {
    id: "us-electoral-college",
    question: "Should the Electoral College be abolished?",
    clarity_score: 8.6,
    tags: ["Elections", "US Constitution", "Democracy"],
    readTime: "6 min",
  },
  {
    id: "us-federal-debt",
    question: "Is the US federal debt sustainable?",
    clarity_score: 7.9,
    tags: ["Fiscal Policy", "Economics", "US Policy"],
    readTime: "7 min",
  },
  {
    id: "us-gun-violence-policy",
    question: "What policies could reduce gun violence in America?",
    clarity_score: 8.0,
    tags: ["Gun Policy", "Public Safety", "Second Amendment"],
    readTime: "7 min",
  },
  {
    id: "us-border-security",
    question: "How effective is current US border security policy?",
    clarity_score: 7.6,
    tags: ["Immigration", "US Policy", "Border Security"],
    readTime: "6 min",
  },
  {
    id: "us-antitrust-big-tech",
    question: "Should Big Tech companies be broken up?",
    clarity_score: 8.2,
    tags: ["Antitrust", "Technology", "Regulation"],
    readTime: "6 min",
  },
  {
    id: "us-minimum-wage-20",
    question: "Should the US raise the federal minimum wage to $20?",
    clarity_score: 8.1,
    tags: ["Labor Policy", "Economics", "Wages"],
    readTime: "5 min",
  },
  {
    id: "us-student-loan-forgiveness",
    question: "What are the effects of student loan forgiveness?",
    clarity_score: 8.0,
    tags: ["Education", "Fiscal Policy", "Inequality"],
    readTime: "6 min",
  },
  {
    id: "us-supreme-court-expansion",
    question: "Should the US expand the Supreme Court?",
    clarity_score: 8.4,
    tags: ["Judiciary", "US Constitution", "Reforms"],
    readTime: "5 min",
  },

  // International Relations
  {
    id: "china-west-relations",
    question: "How should the West respond to China's rise?",
    clarity_score: 8.3,
    tags: ["Geopolitics", "China", "International Relations"],
    readTime: "9 min",
  },
  {
    id: "russia-sanctions-effectiveness",
    question: "How effective are Western sanctions on Russia?",
    clarity_score: 8.1,
    tags: ["Sanctions", "Russia", "International Relations"],
    readTime: "7 min",
  },
  {
    id: "nato-expansion-future",
    question: "Should NATO continue to expand?",
    clarity_score: 7.8,
    tags: ["NATO", "Security", "Geopolitics"],
    readTime: "6 min",
  },

  // Technology & Society
  {
    id: "ai-regulation-approaches",
    question: "How should governments regulate AI?",
    clarity_score: 8.5,
    tags: ["AI", "Technology", "Regulation"],
    readTime: "7 min",
  },
  {
    id: "social-media-democracy",
    question: "Is social media undermining democracy?",
    clarity_score: 8.2,
    tags: ["Social Media", "Democracy", "Disinformation"],
    readTime: "6 min",
  },
  {
    id: "data-privacy-gdpr",
    question: "How effective are data privacy laws like GDPR?",
    clarity_score: 7.9,
    tags: ["Privacy", "Data Protection", "Regulation"],
    readTime: "5 min",
  },

  // Climate & Environment
  {
    id: "carbon-pricing-effectiveness",
    question: "Do carbon taxes actually reduce emissions?",
    clarity_score: 8.3,
    tags: ["Climate", "Carbon Tax", "Economics"],
    readTime: "6 min",
  },
  {
    id: "nuclear-green-transition",
    question: "Should nuclear energy be part of the green transition?",
    clarity_score: 8.4,
    tags: ["Nuclear", "Energy", "Climate"],
    readTime: "7 min",
  },

  // Economic Policy
  {
    id: "universal-basic-income",
    question: "Would universal basic income work?",
    clarity_score: 8.1,
    tags: ["UBI", "Welfare", "Economics"],
    readTime: "7 min",
  },
  {
    id: "gig-economy-workers-rights",
    question: "Should gig workers have full employee rights?",
    clarity_score: 8.0,
    tags: ["Gig Economy", "Labor Rights", "Employment"],
    readTime: "5 min",
  },
  {
    id: "cryptocurrency-regulation",
    question: "Should governments regulate cryptocurrency?",
    clarity_score: 7.7,
    tags: ["Crypto", "Regulation", "Finance"],
    readTime: "6 min",
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
 * Get featured briefs (always include the foundational ones)
 */
export function getFeaturedBriefs(): ShowcaseBrief[] {
  // Always show the first two (What is a state? and 4-day work week) plus 4 random others
  const featured = SHOWCASE_BRIEFS.slice(0, 2);
  const others = SHOWCASE_BRIEFS.slice(2);
  const randomOthers = others.sort(() => Math.random() - 0.5).slice(0, 4);
  return [...featured, ...randomOthers];
}
