"use client";

/**
 * Free Briefs Remaining Banner
 *
 * Shows anonymous users how many free briefs they have remaining.
 * Disappears when user is authenticated.
 */

import { BookOpen } from "lucide-react";
import { usePaywall } from "@/lib/paywall/usePaywall";

export function FreeBriefsRemaining() {
  const { briefsRemaining, isAuthenticated, isLoading, limit } = usePaywall();

  if (isLoading || isAuthenticated) return null;

  const getMessageAndStyle = () => {
    if (briefsRemaining === 0) {
      return {
        message: "You've used all free briefs. Sign up to continue reading.",
        bgClass: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
        textClass: "text-red-700 dark:text-red-300",
        iconClass: "text-red-500",
      };
    }
    if (briefsRemaining === 1) {
      return {
        message: "1 free brief remaining",
        bgClass: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
        textClass: "text-amber-700 dark:text-amber-300",
        iconClass: "text-amber-500",
      };
    }
    return {
      message: `${briefsRemaining} free briefs remaining`,
      bgClass: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      textClass: "text-blue-700 dark:text-blue-300",
      iconClass: "text-blue-500",
    };
  };

  const { message, bgClass, textClass, iconClass } = getMessageAndStyle();

  return (
    <div className={`px-4 py-2 border rounded-lg ${bgClass} flex items-center gap-2`}>
      <BookOpen className={`w-4 h-4 ${iconClass}`} />
      <span className={`text-sm font-medium ${textClass}`}>{message}</span>
      <span className={`text-xs ${textClass} opacity-70`}>
        (of {limit} free)
      </span>
    </div>
  );
}
