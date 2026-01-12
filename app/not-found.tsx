import Link from "next/link";
import { Home, Search, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col">
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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <span className="text-8xl font-heading font-bold text-ivory-500">404</span>
          </div>

          <h1 className="text-2xl font-heading font-semibold text-ink-800 mb-4">
            We couldn&apos;t find that page
          </h1>

          <p className="text-ink-500 font-ui text-base mb-8">
            The page you&apos;re looking for may have been moved or removed. 
            Try searching for what you need or head back to the homepage.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-sage-500 text-ivory-100 font-ui font-medium hover:bg-sage-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            >
              <Home className="w-4 h-4" />
              Go to homepage
            </Link>

            <Link
              href="/ask"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-ivory-600 bg-ivory-50 text-ink-800 font-ui font-medium hover:bg-ivory-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            >
              <Search className="w-4 h-4" />
              Ask a question
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
