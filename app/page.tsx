"use client";

import { useState } from "react";
import { Search, Sparkles, TrendingUp, BookOpen } from "lucide-react";
import Link from "next/link";
import { CreditBalance } from "./components/CreditBalance";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    // TODO: Implement API call
    // For now, redirect to sample brief
    window.location.href = "/brief/uk-four-day-week";
  };

  const showcaseBriefs = [
    {
      id: "what-is-a-state",
      question: "What is a state?",
      clarity_score: 8.7,
      tags: ["Foundational", "Political Philosophy", "First Principles"],
    },
    {
      id: "uk-four-day-week",
      question: "What would be the impacts of a 4-day work week in the UK?",
      clarity_score: 8.4,
      tags: ["Economics", "Labor Policy", "Wellbeing"],
    },
    {
      id: "net-zero-2050",
      question: "Can the UK realistically achieve Net Zero by 2050?",
      clarity_score: 7.9,
      tags: ["Climate", "Energy", "Economics"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">State of Clarity</span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <Link
                href="/about"
                className="text-muted-foreground hover:text-foreground transition"
              >
                About
              </Link>
              <Link
                href="/briefs"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Browse Briefs
              </Link>
              <CreditBalance />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition">
                Sign In
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Applied AI Research Assistant</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            See politics clearly.
            <br />
            <span className="clarity-gradient bg-clip-text text-transparent">
              Decide wisely.
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform any political question into a beautifully crafted,
            evidence-rich policy brief in seconds.
          </p>

          {/* Ask Anything Interface */}
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything... (e.g., 'What are the economic impacts of a 4-day work week?')"
                className="w-full pl-12 pr-32 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-base"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {isLoading ? "Generating..." : "Get Brief"}
              </button>
            </div>
          </form>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left">
            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Progressive Summaries</h3>
              <p className="text-sm text-muted-foreground">
                4 reading levels from child to post-doc. Meets you where you
                are.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Transparent Sources</h3>
              <p className="text-sm text-muted-foreground">
                Every claim linked to primary sources. Bias tags included.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Clarity Score</h3>
              <p className="text-sm text-muted-foreground">
                AI critiques its own answers for bias, gaps, and coherence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Briefs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Explore Showcase Briefs</h2>
          <p className="text-muted-foreground">
            See State of Clarity in action with these pre-generated examples
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showcaseBriefs.map((brief) => (
            <Link
              key={brief.id}
              href={`/brief/${brief.id}`}
              className="group p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`clarity-score-badge ${
                    brief.clarity_score >= 8
                      ? "high"
                      : brief.clarity_score >= 6
                      ? "medium"
                      : "low"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{brief.clarity_score}/10</span>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition">
                {brief.question}
              </h3>

              <div className="flex flex-wrap gap-2">
                {brief.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">State of Clarity</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Raising the quality of political debate by giving any curious
                person the power to summon a beautifully crafted, evidence-rich
                answer on demand.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-foreground">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/principles" className="hover:text-foreground">
                    Principles
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-muted-foreground">
            <p>
              © 2025 State of Clarity. Truth over tribe. Open-source evolution.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
