/**
 * Authentication Providers
 *
 * Functions for various authentication methods:
 * - Email/password
 * - Magic link
 * - Social OAuth (Google, Apple, Twitter/X)
 */

import { createBrowserClient } from "@/lib/supabase/client";

// Social provider types
export type SocialProvider = "google" | "apple" | "twitter";

// Social provider configurations
export const SOCIAL_PROVIDERS: Record<
  SocialProvider,
  { name: string; bgColor: string; textColor: string }
> = {
  google: {
    name: "Google",
    bgColor: "#ffffff",
    textColor: "#1f2937",
  },
  apple: {
    name: "Apple",
    bgColor: "#000000",
    textColor: "#ffffff",
  },
  twitter: {
    name: "X",
    bgColor: "#000000",
    textColor: "#ffffff",
  },
};

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  return { valid: true };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient();
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createBrowserClient();
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/**
 * Sign in with magic link (passwordless)
 */
export async function signInWithMagicLink(email: string) {
  const supabase = createBrowserClient();
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const supabase = createBrowserClient();
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(provider: SocialProvider) {
  const supabase = createBrowserClient();
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = createBrowserClient();
  return await supabase.auth.signOut();
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = createBrowserClient();
  return await supabase.auth.getSession();
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = createBrowserClient();
  return await supabase.auth.getUser();
}
