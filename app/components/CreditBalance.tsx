"use client";

import { useEffect, useState } from "react";
import { Coins, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CreditBalanceProps {
  className?: string;
}

export function CreditBalance({ className = "" }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
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

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const isLowBalance = balance !== null && balance <= 2;
  const isZeroBalance = balance === 0;

  if (isZeroBalance) {
    return (
      <Link
        href="/credits"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition ${className}`}
      >
        <Coins className="w-4 h-4" />
        <span>Buy credits</span>
      </Link>
    );
  }

  return (
    <Link
      href="/credits"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        isLowBalance
          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      } ${className}`}
    >
      {isLowBalance ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <Coins className="w-4 h-4" />
      )}
      <span>{balance} credits</span>
    </Link>
  );
}
