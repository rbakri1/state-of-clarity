import { Skeleton } from "./components/Skeleton";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Header Skeleton */}
      <header className="border-b border-ivory-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg bg-ivory-300" />
              <Skeleton variant="text" className="h-6 w-36 bg-ivory-300" />
            </div>
            <nav className="flex items-center gap-6">
              <Skeleton variant="text" className="h-4 w-12 bg-ivory-300" />
              <Skeleton variant="text" className="h-4 w-24 bg-ivory-300" />
              <Skeleton variant="text" className="h-4 w-20 bg-ivory-300" />
              <Skeleton variant="button" className="h-10 w-20 bg-ivory-300" />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-6">
          {/* Badge */}
          <div className="flex justify-center">
            <Skeleton variant="text" className="h-8 w-56 rounded-full bg-sage-100" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <Skeleton variant="text" className="h-12 w-80 mx-auto bg-ivory-300" />
            <Skeleton variant="text" className="h-12 w-64 mx-auto bg-ivory-300" />
          </div>

          {/* Subtitle */}
          <div className="max-w-2xl mx-auto space-y-2">
            <Skeleton variant="text" className="h-6 w-full bg-ivory-300" />
            <Skeleton variant="text" className="h-6 w-3/4 mx-auto bg-ivory-300" />
          </div>

          {/* Search Input Skeleton */}
          <div className="mt-8">
            <div className="relative max-w-2xl mx-auto">
              <Skeleton className="h-14 w-full rounded-xl bg-ivory-200 border border-ivory-600" />
            </div>
          </div>

          {/* Feature Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-ivory-50 border border-ivory-600"
              >
                <Skeleton className="h-10 w-10 rounded-lg mb-4 bg-sage-100" />
                <Skeleton variant="text" className="h-5 w-32 mb-2 bg-ivory-300" />
                <div className="space-y-1">
                  <Skeleton variant="text" className="h-3 w-full bg-ivory-300" />
                  <Skeleton variant="text" className="h-3 w-5/6 bg-ivory-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Briefs Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-ivory-500">
        <div className="text-center mb-8">
          <Skeleton variant="text" className="h-8 w-64 mx-auto mb-2 bg-ivory-300" />
          <Skeleton variant="text" className="h-5 w-96 mx-auto bg-ivory-300" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-ivory-50 border border-ivory-600"
            >
              {/* Clarity Score Badge */}
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-7 w-20 rounded-full bg-success-light" />
              </div>

              {/* Question Title */}
              <Skeleton variant="text" className="h-6 w-full mb-2 bg-ivory-300" />
              <Skeleton variant="text" className="h-6 w-3/4 mb-3 bg-ivory-300" />

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-md bg-ivory-300" />
                <Skeleton className="h-6 w-24 rounded-md bg-ivory-300" />
                <Skeleton className="h-6 w-16 rounded-md bg-ivory-300" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Skeleton */}
      <footer className="border-t border-ivory-500 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-8 w-8 rounded-lg bg-ivory-300" />
                <Skeleton variant="text" className="h-6 w-36 bg-ivory-300" />
              </div>
              <div className="space-y-2 max-w-md">
                <Skeleton variant="text" className="h-4 w-full bg-ivory-300" />
                <Skeleton variant="text" className="h-4 w-5/6 bg-ivory-300" />
                <Skeleton variant="text" className="h-4 w-4/6 bg-ivory-300" />
              </div>
            </div>

            <div>
              <Skeleton variant="text" className="h-5 w-16 mb-4 bg-ivory-300" />
              <div className="space-y-2">
                <Skeleton variant="text" className="h-4 w-20 bg-ivory-300" />
                <Skeleton variant="text" className="h-4 w-16 bg-ivory-300" />
                <Skeleton variant="text" className="h-4 w-12 bg-ivory-300" />
              </div>
            </div>

            <div>
              <Skeleton variant="text" className="h-5 w-20 mb-4 bg-ivory-300" />
              <div className="space-y-2">
                <Skeleton variant="text" className="h-4 w-16 bg-ivory-300" />
                <Skeleton variant="text" className="h-4 w-20 bg-ivory-300" />
                <Skeleton variant="text" className="h-4 w-18 bg-ivory-300" />
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-ivory-500 text-center">
            <Skeleton variant="text" className="h-4 w-80 mx-auto bg-ivory-300" />
          </div>
        </div>
      </footer>
    </div>
  );
}
