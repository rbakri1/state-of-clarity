import Link from "next/link";
import { Sparkles, ArrowLeft, BookOpen, Eye, Target, Users, Shield, Lightbulb } from "lucide-react";

export const metadata = {
  title: "About | State of Clarity",
  description: "Learn about State of Clarity's mission to raise the quality of political debate through evidence-based policy briefs.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Header */}
      <header className="border-b border-ivory-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-ivory-100" />
              </div>
              <span className="text-xl font-semibold font-heading text-ink-800">State of Clarity</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-700 font-ui mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-semibold font-heading text-ink-800 mb-6">
            See politics clearly.
            <br />
            <span className="text-sage-500">Decide wisely.</span>
          </h1>
          <p className="text-xl font-body text-ink-600 max-w-2xl mx-auto leading-relaxed">
            State of Clarity transforms complex political questions into evidence-based policy briefs 
            with transparent sources, four reading levels, and first-principles reasoning.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">Our Mission</h2>
          <p className="text-ink-700 font-body text-lg leading-relaxed mb-4">
            Political discourse shouldn&apos;t be a shouting match between echo chambers. It should be a 
            collaborative search for truth, grounded in evidence, accessible to everyone, and transparent 
            about uncertainty.
          </p>
          <p className="text-ink-700 font-body text-lg leading-relaxed">
            We&apos;re building a platform where evidence matters more than outrage, where complexity is 
            navigable rather than simplified, and where transparency builds trust. State of Clarity exists 
            to raise the quality of political debate in the UK by making rigorous policy analysis accessible to all.
          </p>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-8">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-ivory-50 border border-ivory-600">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <Eye className="w-5 h-5 text-sage-600" />
              </div>
              <h3 className="font-heading font-semibold text-ink-800 mb-2">Transparency Over Mystification</h3>
              <p className="text-sm font-body text-ink-500">
                Every claim is linked to its source. Every source is scored for credibility and political lean. 
                We show our work so you can verify for yourself.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-ivory-50 border border-ivory-600">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-sage-600" />
              </div>
              <h3 className="font-heading font-semibold text-ink-800 mb-2">Evidence Over Opinion</h3>
              <p className="text-sm font-body text-ink-500">
                We don&apos;t tell you what to think. We show you what the evidence says, acknowledge what&apos;s 
                uncertain, and help you reason from first principles.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-ivory-50 border border-ivory-600">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-sage-600" />
              </div>
              <h3 className="font-heading font-semibold text-ink-800 mb-2">Accessibility Over Gatekeeping</h3>
              <p className="text-sm font-body text-ink-500">
                Four reading levels serve everyone from 8-year-olds to PhD researchers. Complexity shouldn&apos;t 
                be a barrier to understanding policy that affects your life.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-ivory-50 border border-ivory-600">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <Lightbulb className="w-5 h-5 text-sage-600" />
              </div>
              <h3 className="font-heading font-semibold text-ink-800 mb-2">First Principles Over Assumptions</h3>
              <p className="text-sm font-body text-ink-500">
                We build reasoning from foundations, not talking points. Question everything—including us. 
                That&apos;s how truth emerges.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-ivory-50 border border-ivory-600">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-sage-600" />
              </div>
              <h3 className="font-heading font-semibold text-ink-800 mb-2">Community Over Authority</h3>
              <p className="text-sm font-body text-ink-500">
                Truth emerges from collective scrutiny. Spot an error? Suggest a source? Help us improve. 
                Collaborative truth-seeking works best when you challenge our work.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-ivory-50 border border-ivory-600">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-sage-600" />
              </div>
              <h3 className="font-heading font-semibold text-ink-800 mb-2">Rigour Over Partisanship</h3>
              <p className="text-sm font-body text-ink-500">
                We&apos;re not &quot;unbiased&quot;—that&apos;s impossible. We&apos;re transparent. We&apos;re not &quot;neutral&quot;—we&apos;re 
                rigorous. We follow evidence wherever it leads, not tribal loyalties.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sage-500 text-ivory-100 flex items-center justify-center font-ui font-semibold text-sm">
                1
              </div>
              <div>
                <h3 className="font-heading font-semibold text-ink-800 mb-1">Ask Any Policy Question</h3>
                <p className="text-ink-600 font-body">
                  Type a question about UK politics or policy. &quot;Should the UK rejoin the EU?&quot; 
                  &quot;What would happen if we raised the minimum wage?&quot; Anything goes.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sage-500 text-ivory-100 flex items-center justify-center font-ui font-semibold text-sm">
                2
              </div>
              <div>
                <h3 className="font-heading font-semibold text-ink-800 mb-1">We Research & Synthesize</h3>
                <p className="text-ink-600 font-body">
                  Our AI researches your question across diverse sources—government data, think tanks, 
                  academic papers, journalism—scoring each for credibility and political lean.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sage-500 text-ivory-100 flex items-center justify-center font-ui font-semibold text-sm">
                3
              </div>
              <div>
                <h3 className="font-heading font-semibold text-ink-800 mb-1">Read at Your Level</h3>
                <p className="text-ink-600 font-body">
                  Every brief comes in four reading levels: child (8-12), teen (13-17), undergrad (18-22), 
                  and postdoc. Same evidence, tailored depth. No condescension, no gatekeeping.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sage-500 text-ivory-100 flex items-center justify-center font-ui font-semibold text-sm">
                4
              </div>
              <div>
                <h3 className="font-heading font-semibold text-ink-800 mb-1">Verify & Challenge</h3>
                <p className="text-ink-600 font-body">
                  Every claim links to its source. Every brief shows its Clarity Score for bias, gaps, 
                  and coherence. Disagree with something? Help us improve.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-8 rounded-xl bg-sage-50 border border-sage-200">
          <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">
            Ready to see politics clearly?
          </h2>
          <p className="text-ink-600 font-body mb-6 max-w-lg mx-auto">
            Ask any policy question and get an evidence-based brief in under a minute.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-sage-500 text-ivory-100 font-ui font-medium hover:bg-sage-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
          >
            Get Started
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ivory-600 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-sm text-ink-500 font-ui">
            <p>© 2026 State of Clarity. Evidence-based. Non-partisan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
