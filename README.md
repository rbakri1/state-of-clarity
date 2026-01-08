# State of Clarity

> **See politics clearly. Decide wisely.**

An AI-powered policy brief generator that delivers transparent, multi-layered answers to any political question, helping citizens, journalists, and leaders think—and act—with greater precision.

---

## 🎯 Vision

State of Clarity exists to **raise the quality of political debate** by giving any curious person the power to summon a beautifully crafted, evidence-rich answer on demand.

Our north-star metric: **per-question clarity created** — measured by how often users cite SoC outputs in discussions, media, or policymaking.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Anthropic API key ([get one here](https://console.anthropic.com/))
- Supabase account ([create one here](https://supabase.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/state-of-clarity.git
cd state-of-clarity

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📚 Core Features

### 1. **Progressive Summaries**
Four reading levels (child → teen → undergrad → post-doc) make complex policy accessible to everyone.

### 2. **Structured Tables**
- **Definitions**: Key terms explained
- **Factors**: What drives this issue?
- **Policy Options**: Pros/cons with evidence
- **Second-Order Effects**: What happens next?

### 3. **Narrative Analysis**
800-1,200 word cohesive argument that ties everything together.

### 4. **Transparent Citations**
Every claim linked to primary sources with:
- Political lean tags (left/center/right)
- Credibility scores
- Publication dates
- Direct quotes/excerpts

### 5. **Clarity Score**
AI critiques its own output on:
- **First-principles coherence** (25%)
- **Source diversity** (20%)
- **Primary source ratio** (15%)
- **Logical completeness** (15%)
- **Readability** (10%)
- **Recency** (10%)
- **User feedback** (5%)

---

## 🏗️ Architecture

```
├── app/                    # Next.js 14 app directory
│   ├── page.tsx           # Homepage with "Ask Anything"
│   ├── brief/[id]/        # Brief viewer
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities & helpers
├── sample-briefs/         # Example briefs (JSON)
├── ARCHITECTURE.md        # Full technical architecture
└── package.json
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

---

## 🧪 Sample Briefs

Explore these pre-generated examples:

1. **[UK 4-Day Work Week](./sample-briefs/uk-four-day-week.json)** - Economic and social impacts (Clarity: 8.4/10)
2. **UK Net-Zero 2050** - Climate feasibility analysis (Coming soon)
3. **Immigration Quotas** - Economic effects (Coming soon)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API routes, LangGraph (multi-agent orchestration) |
| **AI** | Claude 3.5 Sonnet (Anthropic), Perplexity (research), Voyage (embeddings) |
| **Database** | Supabase (Postgres + pgvector + auth) |
| **Hosting** | Vercel |

---

## 📖 How It Works

### Brief Generation Pipeline

1. **Research Agent** → Uses Perplexity to find 15-20 diverse sources
2. **Structure Agent** → Extracts definitions, factors, policies, consequences
3. **Summary Agent** → Writes 4 reading-level summaries
4. **Narrative Agent** → Crafts 800-1,200 word analysis
5. **Clarity Scorer** → Evaluates quality (targets ≥8/10)
6. **Refinement Agent** → Fixes issues if score <7

See [ARCHITECTURE.md#langgraph-agent-workflow](./ARCHITECTURE.md#langgraph-agent-workflow) for details.

---

## 🎨 Design Principles

1. **Truth > Tribe** – Follow evidence even when it offends priors
2. **80/20 Efficiency** – Fast, high-leverage insights first
3. **Open-Source Evolution** – Every brief is a living document
4. **Decision-Ready** – Outputs conclude with actionable options
5. **User-Centric** – Dynamic layouts reveal complexity without overwhelming

---

## 🗺️ Roadmap

| Quarter | Milestone |
|---------|-----------|
| **Q3 2025** | MVP public beta (5K waitlist users) |
| **Q4 2025** | Policy Sandbox + community comments |
| **Q1 2026** | API for newsrooms & think-tanks |
| **Q2 2026** | Mobile app + voice input |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Key areas where help is needed:
- **Data quality**: Improve source discovery & bias detection
- **UI/UX**: Enhance visualizations & interactivity
- **Testing**: Write tests for agent workflows
- **Documentation**: Expand developer guides

---

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Built with:
- [Claude 3.5 Sonnet](https://www.anthropic.com/claude) by Anthropic
- [Next.js](https://nextjs.org/) by Vercel
- [Supabase](https://supabase.com/)
- [LangGraph](https://langchain-ai.github.io/langgraph/) by LangChain

Inspired by the question: *Can we make politics less tribal and more empirical?*

---

## 📞 Contact

- **Website**: [stateofclarity.com](https://stateofclarity.com) *(coming soon)*
- **Email**: hello@stateofclarity.com
- **Twitter**: [@StateOfClarity](https://twitter.com/StateOfClarity)

---

**Truth over tribe. Open-source evolution. Decision-ready insights.**
