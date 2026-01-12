import { Compass } from "lucide-react";
import { BriefsGrid } from "@/components/explore/briefs-grid";

export const metadata = {
  title: "Explore Briefs | State of Clarity",
  description: "Discover evidence-based policy briefs on topics that matter. Search, filter by tags, and sort by score, date, or popularity.",
};

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-100 text-sage-600 text-sm font-ui font-medium mb-6">
            <Compass className="w-4 h-4" />
            <span>Explore</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-semibold text-ink-800 mb-4">
            Explore Briefs
          </h1>
          <p className="font-body text-lg text-ink-500 max-w-2xl mx-auto leading-relaxed">
            Discover evidence-based policy briefs on the topics that matter to you.
            Search, filter by tags, and find insights backed by transparent sources.
          </p>
        </div>
      </section>

      {/* Briefs Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <BriefsGrid />
      </section>
    </div>
  );
}
