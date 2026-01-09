/**
 * Summary Agent Reading Level Prompts
 *
 * Distinct prompts for each reading level to generate appropriately targeted
 * summaries of policy briefings.
 */

export type ReadingLevel = "child" | "teen" | "undergrad" | "postdoc";

export interface SummaryPrompt {
  level: ReadingLevel;
  name: string;
  targetAudience: string;
  wordCount: { min: number; max: number };
  systemPrompt: string;
  exampleOutput: string;
}

const childPrompt: SummaryPrompt = {
  level: "child",
  name: "Young Reader Summary",
  targetAudience: "Children aged 8-12",
  wordCount: { min: 100, max: 150 },
  systemPrompt: `You are writing a summary for children aged 8-12. Your summary must:

- Use simple, everyday words that a child would understand
- Avoid all jargon and technical terms
- Use analogies to familiar things (school, family, games, everyday life)
- Keep sentences short and clear
- Explain the main idea in a way that relates to their world
- Be encouraging and engaging, not boring or preachy
- Be 100-150 words long

Do NOT use words like: fiscal, monetary, infrastructure, legislation, regulatory, stakeholders, implement, policy, or any complex terms. Instead, use words like: money, rules, buildings, laws, people in charge, put into action, plan.

Focus on answering: "What is this about?" and "Why does it matter to regular people?"`,
  exampleOutput: `**Should the UK have a four-day work week?**

Right now, most grown-ups work five days a week. Some people think we should try four days instead, with the same pay!

Here's why some people like this idea: Workers would get more time with their families and feel less tired. Happy workers might actually do better work! Some companies that tried it said people got just as much done in four days.

But others are worried. Some jobs need someone there every day, like shops and hospitals. And some businesses might not be able to afford paying the same for less time.

Scientists are still figuring out if this would really work for everyone. It's like when your school tries a new rule - you have to test it first to see if it helps!`,
};

const teenPrompt: SummaryPrompt = {
  level: "teen",
  name: "Teen Reader Summary",
  targetAudience: "Teenagers aged 13-17",
  wordCount: { min: 200, max: 250 },
  systemPrompt: `You are writing a summary for teenagers aged 13-17. Your summary must:

- Be accessible but more detailed than a children's version
- Define key terms when you first use them
- Include some real numbers and facts to make it concrete
- Explain why this matters to young people specifically where relevant
- Present different viewpoints fairly
- Use a conversational but informative tone
- Be 200-250 words long

You can use some technical terms but always briefly explain them. For example: "inflation (when prices go up over time)" or "GDP (the total value of everything a country produces)".

Avoid being condescending - teens can handle complexity if it's explained well. Focus on the "so what?" - why should a teenager care about this issue?`,
  exampleOutput: `**Should the UK have a four-day work week?**

The four-day work week is a hot debate right now. The idea is simple: people would work four days instead of five but get paid the same amount. Sounds great, right? But it's more complicated than it seems.

**The case for it:** Several UK companies ran a trial in 2022, and the results were pretty impressive. Most reported that productivity (how much work actually gets done) stayed the same or even improved. Workers reported less burnout and better mental health. For young people entering the workforce, this could mean better work-life balance from the start.

**The concerns:** Critics worry it won't work for all industries. Retail, healthcare, and hospitality often need coverage every day. There's also a question of whether the UK economy can compete globally if workers put in fewer hours than other countries. Some economists warn it could push up inflation (rising prices) if businesses pass on higher per-hour labour costs.

**Where things stand:** There's no government plan to mandate this, but some companies are adopting it voluntarily. It's becoming a negotiating point for workers, especially in tech and professional services.

The debate essentially comes down to: is productivity about hours worked or results delivered?`,
};

const undergradPrompt: SummaryPrompt = {
  level: "undergrad",
  name: "Undergraduate Summary",
  targetAudience: "University students and educated general public",
  wordCount: { min: 350, max: 400 },
  systemPrompt: `You are writing a summary for university students and educated general readers. Your summary must:

- Use academic vocabulary appropriately without excessive jargon
- Cite key sources and studies to support claims
- Present the policy debate with nuance, acknowledging trade-offs
- Include relevant data, statistics, and evidence
- Structure the summary with clear logical flow
- Discuss both empirical evidence and theoretical considerations
- Address implementation challenges and practical considerations
- Be 350-400 words long

Assume the reader is intelligent but not an expert in this specific domain. They can handle complexity but need context for specialised terms or frameworks.

Include specific references like "according to the IFS..." or "a 2022 study by..." to add credibility and allow further reading.`,
  exampleOutput: `**Should the UK have a four-day work week?**

The four-day work week has moved from fringe idea to serious policy discussion, particularly following the UK's 2022 pilot programme coordinated by 4 Day Week Global and researchers from Cambridge University and Boston College.

**Evidence from the UK trial:** The pilot involved 61 companies and approximately 2,900 workers over six months. Results published in 2023 showed that revenue remained broadly stable, with some companies reporting increases. Self-reported burnout fell by 71%, and 92% of participating companies chose to continue the policy after the trial concluded. Critically, productivity metrics (measured differently across industries) generally held steady or improved.

**Economic considerations:** Proponents argue the model addresses structural issues in the modern economy—particularly the diminishing returns of long working hours on productivity, documented in research by Stanford economist John Pencavel. The Autonomy think tank estimates a four-day week could reduce UK carbon emissions through less commuting.

However, the Institute for Fiscal Studies cautions against generalising from self-selected trial participants to the broader economy. Sectors with continuous coverage requirements (healthcare, retail, logistics) face genuine implementation challenges. There are also concerns about labour market competitiveness, though European countries with shorter average working hours (Germany, Netherlands) remain highly productive.

**Distributional effects:** The benefits of reduced hours accrue unevenly. Knowledge workers with output-based roles can often compress work without income loss, while hourly workers may face reduced earnings unless minimum wage legislation adapts. This raises equity concerns that any policy would need to address.

**Implementation pathways:** Unlike a government mandate, the current trend is employer-led adoption, particularly in competitive labour markets where the policy serves as a recruitment advantage. Whether this scales beyond professional services remains uncertain.

**Conclusion:** The evidence suggests a four-day week can maintain productivity in certain contexts, but the policy's broader applicability depends on sector-specific adaptations and careful attention to distributional impacts. The debate is less about whether it's possible and more about where, how, and for whom it works.`,
};

const postdocPrompt: SummaryPrompt = {
  level: "postdoc",
  name: "Expert Summary",
  targetAudience: "Experts, researchers, and senior professionals",
  wordCount: { min: 450, max: 500 },
  systemPrompt: `You are writing a summary for experts, researchers, and senior professionals with domain knowledge. Your summary must:

- Assume significant background knowledge in the field
- Use technical terminology precisely and without over-explanation
- Engage with methodological considerations in the cited evidence
- Discuss second-order effects and systemic implications
- Present nuanced trade-offs without false balance
- Reference academic literature, think tank analysis, and official statistics
- Address limitations in the evidence base
- Discuss policy design considerations and implementation mechanisms
- Be 450-500 words long

The reader can handle technical depth and expects sophisticated analysis. They want to understand the state of the evidence, key uncertainties, and the strongest arguments on each side. Avoid oversimplification—these readers will notice and lose trust.

Include methodological caveats where relevant (selection bias, external validity concerns, measurement issues).`,
  exampleOutput: `**Should the UK have a four-day work week?**

The four-day work week debate has been significantly advanced by recent empirical evidence, though methodological limitations warrant careful interpretation.

**Empirical evidence:** The 2022 UK pilot, coordinated by 4 Day Week Global with academic partners (Cambridge, Boston College), represents the largest controlled trial to date. The findings—stable revenue, reduced burnout (71% reduction in self-reported burnout), high continuation rates (92%)—are notable but require contextualisation. Participating firms were self-selected, likely representing organisations with greater flexibility, output-based work, and pro-innovation leadership. External validity to sectors with continuous coverage requirements, lower-margin businesses, or those with less discretionary work design is questionable.

Longitudinal evidence from Iceland's 2015-2019 public sector trials (2,500 workers) showed similar patterns, with productivity maintenance and wellbeing improvements. However, the Icelandic model involved hours reduction with reorganised workflows rather than a strict four-day model, complicating direct comparison.

**Theoretical frameworks:** The productivity case rests on Parkinson's Law and the empirical relationship between hours and output documented by Pencavel (2014), showing marginal productivity declining sharply beyond 50 hours/week. The standard 40-hour week lacks strong efficiency justification—it emerged from 20th-century industrial bargaining rather than optimisation.

Counter-arguments centre on heterogeneity. Goldin and Katz's work on temporal flexibility shows that some roles (client-facing services, coordination-intensive positions) face genuine constraints from reduced presence. The economic calculus differs substantially between knowledge work (output-fungible) and service work (time-bound).

**Macroeconomic considerations:** Critics raise competitiveness concerns, though this assumes hours directly translate to national output—contradicted by cross-country productivity data showing Germany and the Netherlands (lower average hours) outperforming the UK on productivity per hour. However, the mechanism matters: voluntary firm-level adoption differs from mandated reduction, with the latter potentially creating misallocation.

The IFS notes wage-hour trade-offs: in equilibrium, workers accepting fewer hours at the same wage effectively receive an hourly wage increase. Unless offset by productivity gains, this creates inflationary pressure or margin compression. The sustainability of current trial outcomes depends on whether productivity gains are real or represent short-term Hawthorne effects.

**Distributional analysis:** The benefits asymmetry is underexplored. Professional workers with task autonomy can often compress without loss; hourly workers cannot. Without complementary minimum wage adjustments or sector-specific frameworks, a four-day week could widen existing inequalities in work quality.

**Policy design considerations:** The optimal intervention likely isn't a blanket mandate but rather enabling legislation (right to request), sector-specific frameworks, and continued experimentation. The evidence supports feasibility in certain contexts but not universal applicability.

**Key uncertainties:** Long-term productivity persistence, scalability beyond self-selected firms, sectoral adaptation mechanisms, and second-order labour market effects (e.g., increased multiple job-holding) remain underexplored.`,
};

const promptMap: Record<ReadingLevel, SummaryPrompt> = {
  child: childPrompt,
  teen: teenPrompt,
  undergrad: undergradPrompt,
  postdoc: postdocPrompt,
};

/**
 * Get the summary prompt for a given reading level
 */
export function getSummaryPrompt(level: ReadingLevel): SummaryPrompt {
  return promptMap[level];
}

/**
 * Get all available summary prompts
 */
export function getAllSummaryPrompts(): SummaryPrompt[] {
  return Object.values(promptMap);
}

/**
 * Get all reading levels
 */
export function getAllReadingLevels(): ReadingLevel[] {
  return ["child", "teen", "undergrad", "postdoc"];
}
