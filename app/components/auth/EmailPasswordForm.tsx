"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  isValidEmail,
  isValidPassword,
} from "@/lib/auth/providers";

type FormMode = "signin" | "signup";

interface EmailPasswordFormProps {
  mode: FormMode;
  email: string;
  onEmailChange: (email: string) => void;
  onSuccess: () => void;
  onModeChange: (mode: FormMode) => void;
  onError: (error: string) => void;
}

export function EmailPasswordForm({
  mode,
  email,
  onEmailChange,
  onSuccess,
  onModeChange,
  onError,
}: EmailPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      onError("Please enter a valid email address");
      return;
    }

    const passwordCheck = isValidPassword(password);
    if (!passwordCheck.valid) {
      onError(passwordCheck.message || "Invalid password");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      onError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            onError("Invalid email or password. Please try again.");
          } else if (error.message.includes("Email not confirmed")) {
            onError("Please confirm your email address before signing in.");
          } else {
            onError(error.message);
          }
        } else {
          onSuccess();
        }
      } else {
        const { error, data } = await signUpWithEmail(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            onError("An account with this email already exists. Try signing in.");
          } else {
            onError(error.message);
          }
        } else if (data.user && !data.session) {
          onError("Check your email to confirm your account.");
          onSuccess();
        } else {
          onSuccess();
        }
      }
    } catch {
      onError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      onError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        onError(error.message);
      } else {
        setResetSent(true);
      }
    } catch {
      onError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    if (resetSent) {
      return (
        <div className="text-center py-4">
          <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
            <p className="font-medium">Password reset email sent!</p>
            <p className="text-sm mt-1">Check your email for a link to reset your password.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(false);
              setResetSent(false);
            }}
            className="text-sage-600 hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
          >
            Back to sign in
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <label htmlFor="reset-email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-lg border border-ivory-600 dark:border-gray-700 bg-ivory-50 dark:bg-gray-800 text-ink-800 focus-visible:outline-none focus-visible:border-sage-500 focus-visible:ring-2 focus-visible:ring-sage-500/20 transition"
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full py-3 rounded-lg bg-sage-500 text-white font-medium hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowForgotPassword(false)}
          className="w-full text-center text-sm text-sage-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-lg border border-ivory-600 dark:border-gray-700 bg-ivory-50 dark:bg-gray-800 text-ink-800 focus-visible:outline-none focus-visible:border-sage-500 focus-visible:ring-2 focus-visible:ring-sage-500/20 transition"
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Min. 8 characters" : "Enter your password"}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-ivory-600 dark:border-gray-700 bg-ivory-50 dark:bg-gray-800 text-ink-800 focus-visible:outline-none focus-visible:border-sage-500 focus-visible:ring-2 focus-visible:ring-sage-500/20 transition"
            disabled={isLoading}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mode === "signup" && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="w-full px-4 py-3 rounded-lg border border-ivory-600 dark:border-gray-700 bg-ivory-50 dark:bg-gray-800 text-ink-800 focus-visible:outline-none focus-visible:border-sage-500 focus-visible:ring-2 focus-visible:ring-sage-500/20 transition"
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>
      )}

      {mode === "signin" && (
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-sage-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
          >
            Forgot password?
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !email.trim() || !password.trim()}
        className="w-full py-3 rounded-lg bg-sage-500 text-white font-medium hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {mode === "signin" ? "Signing in..." : "Creating account..."}
          </>
        ) : mode === "signin" ? (
          "Sign in"
        ) : (
          "Create account"
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => onModeChange("signup")}
              className="text-sage-600 hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onModeChange("signin")}
              className="text-sage-600 hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );
}
