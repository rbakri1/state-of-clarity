/**
 * Example policy questions for the homepage placeholder.
 * These rotate to show users the types of questions they can ask.
 * Updated to reflect current affairs in UK and USA (January 2026).
 */

export const EXAMPLE_QUESTIONS: string[] = [
  // UK Politics & Policy
  "Should the UK raise the minimum wage?",
  "What are the impacts of Brexit on UK trade?",
  "Should the UK rejoin the EU single market?",
  "How effective is the UK's net zero strategy?",
  "Should university tuition fees be abolished in England?",
  "What would be the effects of a wealth tax in the UK?",
  "Should the UK implement a four-day work week?",
  "How should the NHS address its funding crisis?",
  "Should the UK lower the voting age to 16?",
  "What are the pros and cons of HS2?",
  "Should the House of Lords be reformed?",
  "How should the UK handle small boat crossings?",
  "What would Scottish independence mean economically?",
  "Should the UK ban conversion therapy?",
  "How effective is the UK's points-based immigration system?",
  "Should cannabis be legalised in the UK?",
  "What are the impacts of austerity on UK public services?",
  "Should the UK implement a universal basic income?",
  "How should the UK address the housing crisis?",
  "What are the effects of Right to Buy on social housing?",
  "Should private schools lose their tax-exempt status?",
  "How effective is the UK's levelling up agenda?",
  "Should the UK introduce proportional representation?",
  "What are the impacts of energy price caps?",
  "How should the UK reform its social care system?",

  // USA Politics & Policy
  "Should the US adopt universal healthcare?",
  "What are the effects of the Inflation Reduction Act?",
  "How should the US address its federal debt?",
  "Should the Electoral College be abolished?",
  "What are the impacts of student loan forgiveness?",
  "How effective is US border security policy?",
  "Should the US implement a carbon tax?",
  "What would federal marijuana legalisation mean?",
  "How should the US address gun violence?",
  "What are the effects of CHIPS Act investments?",
  "Should the US raise the federal minimum wage to $20?",
  "How effective is US antitrust enforcement against Big Tech?",
  "What are the impacts of remote work on US cities?",
  "Should the US expand the Supreme Court?",
  "How should the US address housing affordability?",
  "What are the effects of tariffs on US consumers?",
  "Should the US implement paid family leave?",
  "How effective is US infrastructure spending?",
  "What are the impacts of TikTok restrictions?",
  "Should the US reform Section 230?",
  "How should the US address healthcare costs?",
  "What are the effects of right-to-work laws?",
  "Should the US implement ranked-choice voting?",
  "How effective is US climate policy?",
  "What are the impacts of AI regulation proposals?",

  // International Relations
  "How should the West respond to China's rise?",
  "What are the effects of sanctions on Russia?",
  "How should NATO handle its expansion?",
  "What are the impacts of the Israel-Gaza conflict?",
  "Should the UK increase defence spending to 3% of GDP?",
  "How effective is UN peacekeeping?",
  "What are the effects of AUKUS on regional security?",
  "How should democracies counter disinformation?",
  "What are the impacts of the Global South's growing influence?",
  "Should the US maintain its military presence in Asia?",

  // Economic Policy
  "How should central banks respond to inflation?",
  "What are the effects of quantitative easing?",
  "Should governments regulate cryptocurrency?",
  "What are the impacts of sovereign wealth funds?",
  "How effective are windfall taxes on energy companies?",
  "Should inheritance tax be reformed?",
  "What are the effects of pension triple lock?",
  "How should governments address cost of living crises?",
  "What are the impacts of corporate tax avoidance?",
  "Should gig workers have employee rights?",

  // Technology & Society
  "How should AI be regulated?",
  "What are the effects of social media on democracy?",
  "Should there be a right to repair electronics?",
  "How effective are data privacy laws like GDPR?",
  "What are the impacts of automation on employment?",
  "Should facial recognition be banned in public spaces?",
  "How should governments regulate Big Tech?",
  "What are the effects of algorithmic content curation?",
  "Should internet access be a human right?",
  "How effective are age verification requirements online?",

  // Environment & Climate
  "Should governments ban new oil and gas exploration?",
  "What are the effects of carbon pricing?",
  "How effective is the Paris Agreement?",
  "Should meat consumption be taxed?",
  "What are the impacts of green hydrogen investment?",
  "How should countries finance climate adaptation?",
  "Should airlines be required to use sustainable fuels?",
  "What are the effects of plastic bans?",
  "How effective are electric vehicle subsidies?",
  "Should nuclear energy be part of the green transition?",

  // Social Policy
  "Should assisted dying be legalised?",
  "What are the effects of gender quotas on boards?",
  "How should governments address loneliness?",
  "Should hate speech laws be strengthened?",
  "What are the impacts of school choice policies?",
  "How effective are anti-poverty programmes?",
  "Should prisoners have the right to vote?",
  "What are the effects of drug decriminalisation?",
  "How should governments address declining birth rates?",
  "Should social media have age restrictions?",
];

/**
 * Get a random example question
 */
export function getRandomQuestion(): string {
  return EXAMPLE_QUESTIONS[Math.floor(Math.random() * EXAMPLE_QUESTIONS.length)];
}

/**
 * Get a shuffled subset of questions
 */
export function getShuffledQuestions(count: number = 10): string[] {
  const shuffled = [...EXAMPLE_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
