"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, UserPlus, ArrowLeft, Loader2, Check } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectPath(redirect);
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter your email address." });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    if (!ageVerified) {
      setMessage({ type: "error", text: "Please confirm you are 13 years or older to create an account." });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserClient();
      const callbackUrl = redirectPath
        ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`
        : `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            full_name: fullName.trim() || undefined,
            age_verified: true,
          },
        },
      });

      if (error) {
        if (error.message.includes("rate limit")) {
          setMessage({ type: "error", text: "Too many attempts. Please wait a few minutes and try again." });
        } else {
          setMessage({ type: "error", text: error.message });
        }
        setEmailSent(false);
      } else {
        setMessage({ type: "success", text: "Check your email to confirm your account. It may take a minute to arrive." });
        setEmailSent(true);
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setMessage(null);

    if (!ageVerified) {
      setMessage({ type: "error", text: "Please confirm you are 13 years or older to create an account." });
      return;
    }

    setIsOAuthLoading("google");

    try {
      const supabase = createBrowserClient();
      const callbackUrl = redirectPath
        ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`
        : `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        setIsOAuthLoading(null);
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
      setIsOAuthLoading(null);
    }
  };

  const handleAppleSignUp = async () => {
    setMessage(null);

    if (!ageVerified) {
      setMessage({ type: "error", text: "Please confirm you are 13 years or older to create an account." });
      return;
    }

    setIsOAuthLoading("apple");

    try {
      const supabase = createBrowserClient();
      const callbackUrl = redirectPath
        ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`
        : `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        setIsOAuthLoading(null);
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
      setIsOAuthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-ivory-50 rounded-xl shadow-sm border border-ivory-600 p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-sage-500 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6 text-ivory-100" />
              </div>
              <h1 className="text-2xl font-semibold font-heading text-ink-800 mb-2">Create an account</h1>
              <p className="text-ink-500 font-ui text-sm">
                Save briefs and personalize your experience
              </p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium font-ui text-ink-600 mb-2">
                    Email address <span className="text-error">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-ivory-600 bg-ivory-100 text-ink-800 font-ui placeholder:text-ink-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 focus:outline-none transition-colors duration-200"
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                    aria-required="true"
                    aria-describedby={message?.type === "error" ? "form-error" : undefined}
                  />
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium font-ui text-ink-600 mb-2">
                    Full name <span className="text-ink-400">(optional)</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-lg border border-ivory-600 bg-ivory-100 text-ink-800 font-ui placeholder:text-ink-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 focus:outline-none transition-colors duration-200"
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={ageVerified}
                    onClick={() => setAgeVerified(!ageVerified)}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
                      ageVerified
                        ? "bg-sage-500 border-sage-500"
                        : "border-ivory-700 bg-ivory-100 hover:border-sage-400"
                    }`}
                    disabled={isLoading}
                  >
                    {ageVerified && <Check className="w-3 h-3 text-ivory-100" strokeWidth={3} />}
                  </button>
                  <label
                    htmlFor="age-verification"
                    onClick={() => setAgeVerified(!ageVerified)}
                    className="text-sm font-ui text-ink-600 cursor-pointer select-none"
                  >
                    I confirm that I am 13 years of age or older <span className="text-error">*</span>
                  </label>
                </div>

                {message && (
                  <div
                    id="form-error"
                    role={message.type === "error" ? "alert" : "status"}
                    className={`p-4 rounded-lg text-sm font-ui ${
                      message.type === "success"
                        ? "bg-success-light text-success-dark border border-success/20"
                        : "bg-error-light text-error-dark border border-error/20"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || isOAuthLoading !== null}
                  className="w-full py-3 rounded-lg bg-sage-500 text-ivory-100 font-medium font-ui hover:bg-sage-600 active:bg-sage-700 disabled:bg-ivory-300 disabled:text-ink-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                {message && (
                  <div
                    role="status"
                    className="p-4 rounded-lg text-sm font-ui bg-success-light text-success-dark border border-success/20"
                  >
                    {message.text}
                  </div>
                )}

                <div className="text-center space-y-3">
                  <p className="text-sm font-ui text-ink-600">
                    Didn&apos;t receive the email? Check your spam folder or request a new one.
                  </p>
                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setMessage(null);
                    }}
                    className="w-full py-3 rounded-lg border border-sage-500 text-sage-600 font-medium font-ui hover:bg-sage-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  >
                    Resend verification email
                  </button>
                </div>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ivory-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-ivory-50 text-ink-500 font-ui">
                  Or sign up with
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isLoading || isOAuthLoading !== null}
                className="w-full py-3 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-300 disabled:bg-ivory-200 disabled:text-ink-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 font-medium font-ui text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                {isOAuthLoading === "google" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-ink-500" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

{/* Apple Sign-In - Hidden until Apple Developer account is activated
              <button
                type="button"
                onClick={handleAppleSignUp}
                disabled={isLoading || isOAuthLoading !== null}
                className="w-full py-3 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-300 disabled:bg-ivory-200 disabled:text-ink-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 font-medium font-ui text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                {isOAuthLoading === "apple" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-ink-500" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                      />
                    </svg>
                    Continue with Apple
                  </>
                )}
              </button>
              */}
            </div>

            <div className="mt-6 text-center text-sm font-ui">
              <span className="text-ink-500">Already have an account? </span>
              <Link
                href="/auth/signin"
                className="text-sage-600 hover:text-sage-700 hover:underline underline-offset-2 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-ink-400 font-ui">
              By creating an account, you agree to our{" "}
              <Link
                href="/terms"
                className="text-ink-500 hover:text-sage-600 underline underline-offset-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-ink-500 hover:text-sage-600 underline underline-offset-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-ink-500 hover:text-ink-700 font-ui transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
