"use client";

import Link from "next/link";
import { Sparkles, CheckCircle, ArrowLeft } from "lucide-react";

export default function DeletedAccountPage() {
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
        <div className="w-full max-w-md">
          <div className="bg-ivory-50 rounded-xl shadow-sm border border-ivory-600 p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-success-light flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <h1 className="text-2xl font-semibold font-heading text-ink-800 mb-2">Account Deleted</h1>
              <p className="text-ink-500 font-ui text-sm">
                Your account has been permanently deleted.
              </p>
            </div>

            <div className="bg-ivory-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-ink-600 font-ui">
                All your personal data, saved briefs, and reading history have
                been removed. We&apos;re sorry to see you go.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-center text-ink-500 font-ui">
                If you ever want to come back, you can create a new account at
                any time.
              </p>

              <Link
                href="/"
                className="w-full py-3 rounded-lg bg-sage-500 text-ivory-100 font-medium font-ui hover:bg-sage-600 active:bg-sage-700 transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                Go to homepage
              </Link>

              <Link
                href="/auth/signup"
                className="w-full py-3 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-300 transition-all duration-200 flex items-center justify-center gap-2 font-medium font-ui text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                Create new account
              </Link>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-ink-500 hover:text-ink-700 font-ui transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
