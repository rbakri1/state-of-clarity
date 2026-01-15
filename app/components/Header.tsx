"use client";

import Link from "next/link";
import { Sparkles, MessageCircleQuestion, Compass, Search } from "lucide-react";
import { UserMenu } from "./UserMenu";

export default function Header() {
  return (
    <header className="border-b border-ivory-600 bg-ivory-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-ivory-100" />
            </div>
            <span className="text-xl font-heading font-semibold text-ink-800">State of Clarity</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Briefings Group - subtle sage background to show grouping */}
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-sage-50 border border-sage-100">
              <Link
                href="/ask"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-ui font-medium text-ink-600 hover:text-ink-800 hover:bg-sage-100 rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
              >
                <MessageCircleQuestion className="w-4 h-4" />
                <span>Ask</span>
              </Link>
              <Link
                href="/explore"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-ui font-medium text-ink-600 hover:text-ink-800 hover:bg-sage-100 rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
              >
                <Compass className="w-4 h-4" />
                <span>Explore</span>
              </Link>
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-6 bg-ivory-600" />

            {/* Investigations - standalone */}
            <Link
              href="/accountability"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-ui font-medium text-ink-600 hover:text-ink-800 hover:bg-ivory-300 rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
            >
              <Search className="w-4 h-4" />
              <span>Investigations</span>
            </Link>

            {/* Separator */}
            <div className="hidden sm:block w-px h-6 bg-ivory-600" />

            {/* About */}
            <Link
              href="/about"
              className="hidden sm:block px-3 py-1.5 text-sm font-ui font-medium text-ink-600 hover:text-ink-800 hover:bg-ivory-300 rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
            >
              About
            </Link>

            <UserMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}
