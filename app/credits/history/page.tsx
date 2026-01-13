"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowLeft, Loader2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { CreditBalance } from "../../components/CreditBalance";
import { CreditTransactionType } from "@/lib/supabase/client";

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: CreditTransactionType;
  description: string | null;
  brief_id: string | null;
  stripe_payment_id: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/credits/history?page=${currentPage}`);
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please sign in to view your transaction history.");
          } else {
            setError("Failed to load transaction history.");
          }
          return;
        }
        const data = await res.json();
        setTransactions(data.transactions);
        setPagination(data.pagination);
      } catch {
        setError("Failed to load transaction history.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: CreditTransactionType) => {
    const labels: Record<CreditTransactionType, string> = {
      purchase: "Purchase",
      usage: "Usage",
      refund: "Refund",
      expiry: "Expired",
      bonus: "Bonus",
      onboarding: "Welcome",
    };
    return labels[type] || type;
  };

  const getTypeStyles = (type: CreditTransactionType) => {
    const styles: Record<CreditTransactionType, string> = {
      purchase: "bg-success-light text-success-dark border border-success",
      usage: "bg-info-light text-info-dark border border-info",
      refund: "bg-warning-light text-warning-dark border border-warning",
      expiry: "bg-error-light text-error-dark border border-error",
      bonus: "bg-sage-100 text-sage-700 border border-sage-300",
      onboarding: "bg-sage-100 text-sage-700 border border-sage-300",
    };
    return styles[type] || "bg-ivory-200 text-ink-700 border border-ivory-300";
  };

  const getAmountDisplay = (amount: number) => {
    if (amount > 0) {
      return <span className="text-success-dark font-semibold">+{amount}</span>;
    }
    return <span className="text-error-dark font-semibold">{amount}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ivory-50 to-ivory-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sage-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory-50 to-ivory-100">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          href="/credits"
          className="inline-flex items-center gap-2 text-ink-600 hover:text-sage-600 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Credits</span>
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink-900 mb-2">Transaction History</h1>
          <p className="text-ink-600">
            View all your credit purchases, usage, and refunds.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-error-light border border-error text-error-dark text-center">
            {error}
          </div>
        )}

        {!error && transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink-600 mb-4">No transactions yet.</p>
            <Link
              href="/credits"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sage-500 text-white hover:bg-sage-600 transition"
            >
              Buy Credits
            </Link>
          </div>
        ) : (
          <>
            {/* Transactions Table */}
            <div className="bg-white rounded-xl border border-ivory-300 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ivory-300 bg-ivory-100">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-ink-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-ivory-50 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-800">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeStyles(
                              tx.transaction_type
                            )}`}
                          >
                            {getTypeLabel(tx.transaction_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          {getAmountDisplay(tx.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-600">
                          <div className="flex items-center gap-2">
                            <span>{tx.description || "—"}</span>
                            {tx.brief_id && (
                              <Link
                                href={`/brief/${tx.brief_id}`}
                                className="inline-flex items-center gap-1 text-sage-600 hover:text-sage-700 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span className="text-xs">View brief</span>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-ink-600">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.totalCount
                  )}{" "}
                  of {pagination.totalCount} transactions
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded-lg border border-ivory-300 hover:bg-ivory-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-ink-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-ink-600 px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg border border-ivory-300 hover:bg-ivory-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-ink-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
