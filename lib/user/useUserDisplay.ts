"use client";

/**
 * User Display Hook
 *
 * Provides user authentication state and display information.
 * Handles anonymous posting preferences and display name logic.
 */

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface UserDisplayState {
  userId: string | null;
  displayName: string;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

export function useUserDisplay(): UserDisplayState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Get initial session
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const displayName = isAnonymous
    ? "Anonymous User"
    : user?.email?.split("@")[0] || "Guest";

  return {
    userId: user?.id ?? null,
    displayName,
    isAnonymous,
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}
