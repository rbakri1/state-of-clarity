import { Suspense } from "react";
import { Compass } from "lucide-react";
import { ExploreContent } from "@/components/explore/explore-content";

export const metadata = {
  title: "Explore Briefs | State of Clarity",
  description: "Discover evidence-based policy briefs on topics that matter. Search, filter by tags, and sort by score, date, or popularity.",
};

function ExploreContentSkeleton() {
  return (
    <div>
      {/* Search input skeleton */}
      <div className="mb-8">
        <div className="h-12 bg-ivory-300 rounded-xl animate-pulse" />
      </div>

      {/* Results count skeleton */}
      <div className="mb-6">
        <div className="h-5 w-40 bg-ivory-300 rounded animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col p-6 rounded-xl bg-ivory-50 border border-ivory-600 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-7 w-16 bg-ivory-300 rounded-full" />
              <div className="h-5 w-14 bg-ivory-300 rounded" />
            </div>
            <div className="h-6 bg-ivory-300 rounded mb-2 w-full" />
            <div className="h-6 bg-ivory-300 rounded mb-3 w-3/4" />
            <div className="h-4 bg-ivory-300 rounded mb-1 w-full" />
            <div className="h-4 bg-ivory-300 rounded mb-4 w-5/6" />
            <div className="flex gap-2 mt-auto">
              <div className="h-6 w-16 bg-ivory-300 rounded-md" />
              <div className="h-6 w-20 bg-ivory-300 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Suspense fallback={<ExploreContentSkeleton />}>
          <ExploreContent />
        </Suspense>
      </section>
    </div>
  );
}
