import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/app/components/Skeleton";

export default function BriefLoading() {
  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Header */}
      <header className="border-b border-ivory-600 sticky top-0 bg-ivory-100/80 backdrop-blur-md z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-ivory-100" />
              </div>
              <span className="text-xl font-heading font-bold text-ink-800">State of Clarity</span>
            </Link>

            <div className="flex items-center gap-2">
              <Skeleton variant="button" className="h-9 w-9 bg-ivory-300" />
              <Skeleton variant="button" className="h-9 w-9 bg-ivory-300" />
              <Skeleton variant="button" className="h-9 w-28 bg-ivory-300" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Brief Header Section */}
        <section className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-4">
            <Skeleton variant="text" className="h-10 w-3/4 bg-ivory-300" />
            <Skeleton variant="button" className="h-8 w-20 rounded-full shrink-0 bg-success-light" />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Skeleton variant="text" className="h-4 w-48 bg-ivory-300" />
            <Skeleton variant="text" className="h-4 w-20 bg-ivory-300" />
            <div className="flex gap-2">
              <Skeleton variant="text" className="h-6 w-16 rounded-md bg-ivory-300" />
              <Skeleton variant="text" className="h-6 w-20 rounded-md bg-ivory-300" />
              <Skeleton variant="text" className="h-6 w-14 rounded-md bg-ivory-300" />
            </div>
          </div>
        </section>

        {/* Reading Level Selector */}
        <section className="mb-10">
          <div className="flex gap-2">
            <Skeleton variant="button" className="h-10 w-24 bg-sage-100" />
            <Skeleton variant="button" className="h-10 w-24 bg-ivory-300" />
            <Skeleton variant="button" className="h-10 w-24 bg-ivory-300" />
          </div>
        </section>

        {/* Summary Section */}
        <section className="mb-12">
          <Skeleton variant="text" className="h-6 w-24 mb-4 bg-ivory-300" />
          <Skeleton variant="paragraph" lines={4} />
        </section>

        {/* Structured Data Sections */}
        <section className="mb-12">
          <Skeleton variant="text" className="h-6 w-44 mb-6 bg-ivory-300" />
          <div className="space-y-4">
            <Skeleton variant="card" className="bg-ivory-200 border-ivory-600" />
            <Skeleton variant="card" className="bg-ivory-200 border-ivory-600" />
            <Skeleton variant="card" className="bg-ivory-200 border-ivory-600" />
          </div>
        </section>

        {/* Narrative Analysis */}
        <section className="mb-12">
          <Skeleton variant="text" className="h-6 w-40 mb-4 bg-ivory-300" />
          <Skeleton variant="paragraph" lines={6} />
        </section>

        {/* Sources Section */}
        <section className="mb-12">
          <Skeleton variant="text" className="h-6 w-32 mb-4 bg-ivory-300" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton variant="card" className="h-24 bg-ivory-200 border-ivory-600" />
            <Skeleton variant="card" className="h-24 bg-ivory-200 border-ivory-600" />
            <Skeleton variant="card" className="h-24 bg-ivory-200 border-ivory-600" />
            <Skeleton variant="card" className="h-24 bg-ivory-200 border-ivory-600" />
          </div>
        </section>

        {/* Feedback Section */}
        <section className="pt-8 border-t border-ivory-500">
          <Skeleton variant="text" className="h-6 w-48 mb-4 bg-ivory-300" />
          <Skeleton variant="text" className="h-4 w-full mb-4 bg-ivory-300" />
          <div className="flex flex-wrap gap-3">
            <Skeleton variant="button" className="h-10 w-24 bg-ivory-300" />
            <Skeleton variant="button" className="h-10 w-28 bg-ivory-300" />
            <Skeleton variant="button" className="h-10 w-32 bg-ivory-300" />
            <Skeleton variant="button" className="h-10 w-26 bg-ivory-300" />
          </div>
        </section>
      </main>
    </div>
  );
}
