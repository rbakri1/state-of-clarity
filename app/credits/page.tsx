"use client";

import { useEffect, useState } from "react";
import { Coins, Check, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const [paymentServiceAvailable, setPaymentServiceAvailable] = useState(true);

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
    
    async function checkPaymentService() {
      try {
        const res = await fetch("/api/payments/health");
        if (res.ok) {
          const data = await res.json();
          setPaymentServiceAvailable(data.healthy);
        }
      } catch {
        setPaymentServiceAvailable(false);
      }
    }
    
    fetchData();
    checkPaymentService();
  }, []);

  const handlePurchase = async (packageId: string) => {
    if (!paymentServiceAvailable) {
      setError("Payment service is temporarily unavailable. Please try again later.");
      return;
    }
    
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
        
        if (data.code === "PAYMENT_SERVICE_ERROR") {
          setPaymentServiceAvailable(false);
          setError("Payment service is temporarily unavailable. Please try again later.");
        } else {
          setError(data.error || "Failed to create checkout session.");
        }
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
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sage-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Balance */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-ivory-50 border border-ivory-600 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center">
              <Coins className="w-6 h-6 text-sage-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-ui text-ink-500">Your Balance</p>
              <p className="text-3xl font-heading font-semibold text-ink-800">{balance} credits</p>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-semibold text-ink-800 mb-2">Buy Credits</h1>
          <p className="font-body text-ink-500">
            Each brief generation costs 1 credit. Buy more to save.
          </p>
        </div>

        {!paymentServiceAvailable && (
          <div className="mb-8 p-4 rounded-lg bg-warning-light border border-warning text-warning-dark flex items-center justify-center gap-2 font-ui text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Payment service is temporarily unavailable. Please try again later.</span>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-error-light border border-error text-error-dark text-center font-ui text-sm">
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
                className={cn(
                  "relative p-6 rounded-xl bg-ivory-50 border-2 transition-all duration-200",
                  isStandard
                    ? "border-sage-500 shadow-lg shadow-sage-500/10"
                    : "border-ivory-600 hover:border-sage-400"
                )}
              >
                {isStandard && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-sage-500 text-ivory-100 text-xs font-ui font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg font-heading font-semibold text-ink-800 mb-1">{pkg.name}</h3>
                  <div className="text-4xl font-heading font-semibold text-ink-800 mb-1">
                    {pkg.credits}
                    <span className="text-base font-body font-normal text-ink-500 ml-1">
                      credits
                    </span>
                  </div>
                  <div className="text-2xl font-heading font-semibold text-sage-600">
                    £{pkg.price_gbp.toFixed(2)}
                  </div>
                  <p className="text-sm font-ui text-ink-500 mt-2">
                    £{getPerCreditPrice(pkg)} per credit
                  </p>
                </div>

                <ul className="space-y-2 mb-6 text-sm font-ui">
                  <li className="flex items-center gap-2 text-ink-500">
                    <Check className="w-4 h-4 text-success" />
                    <span>{pkg.credits} brief{pkg.credits > 1 ? "s" : ""}</span>
                  </li>
                  <li className="flex items-center gap-2 text-ink-500">
                    <Check className="w-4 h-4 text-success" />
                    <span>12-month expiry</span>
                  </li>
                  {isBestValue && pkg.credits > 1 && (
                    <li className="flex items-center gap-2 text-success-dark font-medium">
                      <Check className="w-4 h-4" />
                      <span>Best value</span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isPurchasing || !!purchasingPackageId || !paymentServiceAvailable}
                  className={cn(
                    "w-full py-3 rounded-lg font-ui font-medium transition-all duration-200 flex items-center justify-center gap-2",
                    isStandard
                      ? "bg-sage-500 text-ivory-100 hover:bg-sage-600"
                      : "bg-ivory-300 text-ink-700 hover:bg-ivory-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : !paymentServiceAvailable ? (
                    <span>Unavailable</span>
                  ) : (
                    <span>Buy Now</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center text-sm font-ui text-ink-500">
          <p>
            Secure payments powered by Stripe.
            <br />
            Apple Pay and Google Pay available where supported.
          </p>
          <Link
            href="/credits/history"
            className="inline-block mt-4 text-sage-600 hover:text-sage-700 hover:underline transition-colors duration-200"
          >
            View transaction history →
          </Link>
        </div>
      </main>
    </div>
  );
}
