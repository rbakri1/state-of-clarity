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
import { identifyUser, resetUser } from "@/lib/posthog";

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

        // Identify user in PostHog if already logged in
        if (user) {
          identifyUser(user.id, {
            email: user.email,
            name: user.user_metadata?.full_name,
            createdAt: user.created_at,
          });
        }
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsLoading(false);

      // Identify or reset user in PostHog
      if (currentUser) {
        identifyUser(currentUser.id, {
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name,
          createdAt: currentUser.created_at,
        });
      } else if (event === "SIGNED_OUT") {
        resetUser();
      }
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
