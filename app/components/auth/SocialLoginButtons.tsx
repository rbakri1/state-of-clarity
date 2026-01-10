"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  SOCIAL_PROVIDERS,
  SocialProvider,
  signInWithOAuth,
} from "@/lib/auth/providers";

interface SocialLoginButtonsProps {
  disabled?: boolean;
  onError?: (error: string) => void;
}

export function SocialLoginButtons({
  disabled = false,
  onError,
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(
    null
  );

  const handleSocialLogin = async (provider: SocialProvider) => {
    setLoadingProvider(provider);

    try {
      const { error: authError } = await signInWithOAuth(provider);
      if (authError) {
        onError?.(authError.message);
      }
    } catch {
      onError?.("Something went wrong. Please try again.");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {(Object.keys(SOCIAL_PROVIDERS) as SocialProvider[]).map((provider) => {
        const config = SOCIAL_PROVIDERS[provider];
        const isLoading = loadingProvider === provider;

        return (
          <button
            key={provider}
            onClick={() => handleSocialLogin(provider)}
            disabled={disabled || loadingProvider !== null}
            className="w-full py-3 rounded-lg border border-gray-200 dark:border-gray-700 font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-3"
            style={{
              backgroundColor: config.bgColor,
              color: config.textColor,
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <SocialIcon provider={provider} />
            )}
            Continue with {config.name}
          </button>
        );
      })}
    </div>
  );
}

function SocialIcon({ provider }: { provider: SocialProvider }) {
  switch (provider) {
    case "google":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      );
    case "apple":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.51-3.22 0-1.43.65-2.18.48-3.03-.4C3.25 15.66 3.91 8.95 9.15 8.7c1.26.06 2.15.68 2.9.72.79-.16 1.55-.62 2.38-.56 1.19.09 2.09.57 2.68 1.45-2.45 1.48-1.86 4.73.61 5.63-.47 1.2-.9 2.37-1.97 3.34zM12.03 8.63c-.1-2.01 1.47-3.69 3.36-3.88.22 2.19-1.91 3.83-3.36 3.88z" />
        </svg>
      );
    case "twitter":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    default:
      return null;
  }
}
