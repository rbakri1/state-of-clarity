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
    };
    return labels[type] || type;
  };

  const getTypeStyles = (type: CreditTransactionType) => {
    const styles: Record<CreditTransactionType, string> = {
      purchase: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      usage: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      refund: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      expiry: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      bonus: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return styles[type] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  };

  const getAmountDisplay = (amount: number) => {
    if (amount > 0) {
      return <span className="text-green-600 dark:text-green-400">+{amount}</span>;
    }
    return <span className="text-red-600 dark:text-red-400">{amount}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          href="/credits"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Credits</span>
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-muted-foreground">
            View all your credit purchases, usage, and refunds.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-center">
            {error}
          </div>
        )}

        {!error && transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No transactions yet.</p>
            <Link
              href="/credits"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              Buy Credits
            </Link>
          </div>
        ) : (
          <>
            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>{tx.description || "—"}</span>
                            {tx.brief_id && (
                              <Link
                                href={`/brief/${tx.brief_id}`}
                                className="inline-flex items-center gap-1 text-primary hover:underline"
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
                <p className="text-sm text-muted-foreground">
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
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
