"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, CheckCircle, Coins, Loader2 } from "lucide-react";
import Link from "next/link";

interface SessionData {
  creditsAdded: number;
  balance: number;
  expiresAt: string;
  status: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      if (!sessionId) {
        setError("No session ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/payments/session?session_id=${sessionId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to verify purchase");
          return;
        }
        const data = await res.json();
        setSessionData(data);
      } catch {
        setError("Failed to verify purchase");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  const formatExpiryDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your purchase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 mb-6">
            {error}
          </div>
          <Link
            href="/credits"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Go to Credits
          </Link>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return null; // Already handled above in the isLoading check
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <main className="max-w-lg mx-auto px-4 py-16">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank you for your purchase!</h1>
          <p className="text-muted-foreground">
            Your credits have been added to your account.
          </p>
        </div>

        {/* Purchase Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Credits Added</p>
              <p className="text-2xl font-bold">+{sessionData?.creditsAdded}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Balance</span>
              <span className="font-semibold">{sessionData?.balance} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credits expire on</span>
              <span className="font-semibold">
                {sessionData?.expiresAt && formatExpiryDate(sessionData.expiresAt)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="block w-full py-4 rounded-lg bg-primary text-primary-foreground font-medium text-center hover:opacity-90 transition"
        >
          Generate a brief
        </Link>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/credits/history" className="text-primary hover:underline">
            View transaction history
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying your purchase...</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
