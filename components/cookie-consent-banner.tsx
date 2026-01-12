"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "cookie-consent";

interface ConsentData {
  value: "accepted" | "declined";
  timestamp: string;
}

type ConsentValue = "accepted" | "declined" | null;

function getStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) return null;
  
  try {
    const data: ConsentData = JSON.parse(stored);
    if (data.value === "accepted" || data.value === "declined") {
      return data.value;
    }
  } catch {
    if (stored === "accepted" || stored === "declined") {
      return stored;
    }
  }
  return null;
}

export function getConsentStatus(): ConsentValue {
  return getStoredConsent();
}

export function hasAcceptedCookies(): boolean {
  return getStoredConsent() === "accepted";
}

function storeConsent(value: "accepted" | "declined") {
  const data: ConsentData = {
    value,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
}

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    storeConsent("accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    storeConsent("declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          <p>
            We use cookies to enhance your experience. Essential cookies keep you logged in and
            remember your preferences. Analytics cookies help us improve State of Clarity.{" "}
            <Link href="/privacy" className="text-sage-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded">
              Learn more in our Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-800 border border-ivory-600 dark:border-gray-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-sage-500 hover:bg-sage-600 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
