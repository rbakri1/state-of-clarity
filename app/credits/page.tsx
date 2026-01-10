"use client";

import { useEffect, useState } from "react";
import { Sparkles, Coins, Check, Loader2 } from "lucide-react";
import Link from "next/link";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_gbp: number;
  stripe_price_id: string | null;
  active: boolean;
  created_at: string;
}

export default function CreditsPage() {
  const [balance, setBalance] = useState<number>(0);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/credits");
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please sign in to purchase credits.");
          } else {
            setError("Failed to load credit packages.");
          }
          return;
        }
        const data = await res.json();
        setBalance(data.balance);
        setPackages(data.packages);
      } catch {
        setError("Failed to load credit packages.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handlePurchase = async (packageId: string) => {
    setPurchasingPackageId(packageId);
    setError(null);

    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: packageId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create checkout session.");
        setPurchasingPackageId(null);
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
      setPurchasingPackageId(null);
    }
  };

  const getPerCreditPrice = (pkg: CreditPackage) => {
    return (pkg.price_gbp / pkg.credits).toFixed(2);
  };

  const getBestValue = (packages: CreditPackage[]) => {
    if (packages.length === 0) return null;
    return packages.reduce((best, pkg) => {
      const bestPerCredit = best.price_gbp / best.credits;
      const pkgPerCredit = pkg.price_gbp / pkg.credits;
      return pkgPerCredit < bestPerCredit ? pkg : best;
    });
  };

  const bestValuePackage = getBestValue(packages);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">State of Clarity</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Balance */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-3xl font-bold">{balance} credits</p>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Buy Credits</h1>
          <p className="text-muted-foreground">
            Each brief generation costs 1 credit. Buy more to save.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Package Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => {
            const isStandard = pkg.name === "Standard";
            const isBestValue = bestValuePackage?.id === pkg.id;
            const isPurchasing = purchasingPackageId === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`relative p-6 rounded-xl bg-white dark:bg-gray-800 border-2 transition ${
                  isStandard
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {isStandard && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-1">{pkg.name}</h3>
                  <div className="text-4xl font-bold mb-1">
                    {pkg.credits}
                    <span className="text-base font-normal text-muted-foreground ml-1">
                      credits
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-primary">
                    £{pkg.price_gbp.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    £{getPerCreditPrice(pkg)} per credit
                  </p>
                </div>

                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{pkg.credits} brief{pkg.credits > 1 ? "s" : ""}</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>12-month expiry</span>
                  </li>
                  {isBestValue && pkg.credits > 1 && (
                    <li className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                      <Check className="w-4 h-4" />
                      <span>Best value</span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isPurchasing || !!purchasingPackageId}
                  className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    isStandard
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Buy Now</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Secure payments powered by Stripe.
            <br />
            Apple Pay and Google Pay available where supported.
          </p>
          <Link
            href="/credits/history"
            className="inline-block mt-4 text-primary hover:underline"
          >
            View transaction history →
          </Link>
        </div>
      </main>
    </div>
  );
}
