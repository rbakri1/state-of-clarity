"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LogIn, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-50 animate-in fade-in duration-150" />
        <Dialog.Content
          aria-modal="true"
          aria-labelledby="auth-required-title"
          aria-describedby="auth-required-description"
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-[calc(100%-2rem)] max-w-md",
            "rounded-2xl bg-ivory-100 shadow-xl border border-ivory-600",
            "p-6 sm:p-8",
            "animate-in fade-in duration-150",
            "focus:outline-none"
          )}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-lg",
              "text-ink-400 hover:text-ink-600 hover:bg-ivory-300",
              "transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
            )}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-100 mb-4">
              <LogIn className="w-8 h-8 text-sage-600" aria-hidden="true" />
            </div>
            <Dialog.Title
              id="auth-required-title"
              className="text-2xl sm:text-3xl font-heading font-semibold text-ink-800 mb-2"
            >
              Please sign in first
            </Dialog.Title>
            <Dialog.Description
              id="auth-required-description"
              className="text-ink-600 font-body text-base"
            >
              Create an account or sign in to generate policy briefs and save your questions.
            </Dialog.Description>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/signup"
              className={cn(
                "w-full py-3 px-6 rounded-lg",
                "bg-sage-500 text-ivory-100 font-ui font-semibold text-base",
                "hover:bg-sage-600 active:bg-sage-700",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100",
                "inline-flex items-center justify-center gap-2"
              )}
            >
              <UserPlus className="w-5 h-5" aria-hidden="true" />
              Create Account
            </Link>
            <Link
              href="/auth/signin"
              className={cn(
                "w-full py-2.5 px-6 rounded-lg text-center",
                "border border-ivory-600 bg-ivory-100 text-ink-700 font-ui font-medium text-sm",
                "hover:bg-ivory-200 hover:border-ivory-700",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100",
                "inline-flex items-center justify-center gap-2"
              )}
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              Sign In
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
