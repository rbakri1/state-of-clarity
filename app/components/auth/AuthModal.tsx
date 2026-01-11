"use client";

import { useState, createContext, useContext, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Mail, Loader2, KeyRound } from "lucide-react";
import { signInWithMagicLink, isValidEmail } from "@/lib/auth/providers";
import { EmailPasswordForm } from "./EmailPasswordForm";
import { SocialLoginButtons } from "./SocialLoginButtons";

type AuthMode = "signin" | "signup";
type AuthStep = "initial" | "email-sent";
type AuthMethod = "magic-link" | "password";

interface AuthModalContextType {
  isOpen: boolean;
  openModal: (mode?: AuthMode) => void;
  closeModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [step, setStep] = useState<AuthStep>("initial");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = useCallback((initialMode: AuthMode = "signin") => {
    setMode(initialMode);
    setStep("initial");
    setAuthMethod("password");
    setEmail("");
    setError(null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEmail("");
    setError(null);
    setStep("initial");
    setAuthMethod("password");
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const { error: authError } = await signInWithMagicLink(email);
      if (authError) {
        setError(authError.message);
      } else {
        setStep("email-sent");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
  };

  return (
    <AuthModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <Dialog.Close asChild>
              <button
                className="absolute right-4 top-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>

            {step === "initial" ? (
              <>
                <Dialog.Title className="text-2xl font-bold mb-2">
                  {mode === "signin" ? "Welcome back" : "Create an account"}
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground mb-6">
                  {mode === "signin"
                    ? "Sign in to access your saved briefs and reading history."
                    : "Join State of Clarity for unlimited access to policy briefs."}
                </Dialog.Description>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Auth Method Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                  <button
                    type="button"
                    onClick={() => setAuthMethod("password")}
                    className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition ${
                      authMethod === "password"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <KeyRound className="w-4 h-4 inline mr-2" />
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod("magic-link")}
                    className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition ${
                      authMethod === "magic-link"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    Magic Link
                  </button>
                </div>

                {authMethod === "password" ? (
                  <EmailPasswordForm
                    mode={mode}
                    email={email}
                    onEmailChange={setEmail}
                    onSuccess={closeModal}
                    onModeChange={setMode}
                    onError={setError}
                  />
                ) : (
                  <>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium mb-2"
                        >
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                            disabled={isLoading}
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !email.trim()}
                        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send magic link"
                        )}
                      </button>
                    </form>

                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      {mode === "signin" ? (
                        <>
                          Don&apos;t have an account?{" "}
                          <button
                            onClick={toggleMode}
                            className="text-primary hover:underline font-medium"
                          >
                            Sign up
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{" "}
                          <button
                            onClick={toggleMode}
                            className="text-primary hover:underline font-medium"
                          >
                            Sign in
                          </button>
                        </>
                      )}
                    </p>
                  </>
                )}

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <SocialLoginButtons
                  disabled={isLoading}
                  onError={setError}
                />
              </>
            ) : (
              <>
                <Dialog.Title className="text-2xl font-bold mb-2">
                  Check your email
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground mb-6">
                  We sent a magic link to{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                  Click the link in the email to sign in.
                </Dialog.Description>

                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
                  <Mail className="w-12 h-12 mx-auto text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Can&apos;t find the email? Check your spam folder or{" "}
                    <button
                      onClick={() => setStep("initial")}
                      className="text-primary hover:underline"
                    >
                      try again
                    </button>
                    .
                  </p>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AuthModalContext.Provider>
  );
}

export { AuthModalContext };
