"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, Coins } from "lucide-react";
import Link from "next/link";

const DISMISS_KEY = "lowBalanceWarningDismissed";

interface LowBalanceWarningProps {
  className?: string;
}

export function LowBalanceWarning({ className = "" }: LowBalanceWarningProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem(DISMISS_KEY) === "true";
      setIsDismissed(dismissed);
    }

    async function fetchBalance() {
      try {
        const res = await fetch("/api/credits/balance");
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        setBalance(data.balance);
        setIsAuthenticated(true);
      } catch {
        // Silently fail - user may not be authenticated
      } finally {
        setIsLoading(false);
      }
    }
    fetchBalance();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "true");
    }
  };

  if (isLoading || !isAuthenticated || isDismissed) {
    return null;
  }

  const showWarning = balance !== null && balance > 0 && balance <= 2;

  if (!showWarning) {
    return null;
  }

  return (
    <div
      className={`relative flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Low credit balance
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            You have {balance} credit{balance !== 1 ? "s" : ""} remaining. Top up to keep generating briefs.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/credits"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition"
        >
          <Coins className="w-4 h-4" />
          Top up now
        </Link>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/50 transition"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
