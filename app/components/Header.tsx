"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">State of Clarity</span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/about"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition"
            >
              About
            </Link>
            <Link
              href="/briefs"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition"
            >
              Browse Briefs
            </Link>
            <UserMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}
