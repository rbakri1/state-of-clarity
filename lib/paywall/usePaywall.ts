"use client";

/**
 * Paywall Hook
 *
 * Provides paywall state including remaining briefs and authentication status.
 * Used to manage free tier limits and premium access.
 */

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const FREE_TIER_LIMIT = 3;

interface PaywallState {
  briefsRemaining: number;
  limit: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPremium: boolean;
}

export function usePaywall(): PaywallState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [briefsViewed, setBriefsViewed] = useState(0);

  useEffect(() => {
    const supabase = createBrowserClient();

    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);

        if (user) {
          // Check if user has credits (premium)
          const { data: credits } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", user.id)
            .single();

          const balance = (credits as { balance: number } | null)?.balance ?? 0;
          setIsPremium(balance > 0);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Get briefs viewed from localStorage for non-authenticated users
    const viewed = localStorage.getItem("briefsViewed");
    if (viewed) {
      setBriefsViewed(parseInt(viewed, 10));
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const briefsRemaining = isPremium
    ? Infinity
    : Math.max(0, FREE_TIER_LIMIT - briefsViewed);

  return {
    briefsRemaining,
    limit: FREE_TIER_LIMIT,
    isAuthenticated,
    isLoading,
    isPremium,
  };
}
