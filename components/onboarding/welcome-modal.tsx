"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, Users, Search, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "has-seen-welcome";

interface WelcomeModalProps {
  className?: string;
}

export function WelcomeModal({ className }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const getStartedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          onKeyDown={handleKeyDown}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            getStartedRef.current?.focus();
          }}
          aria-modal="true"
          aria-labelledby="welcome-title"
          aria-describedby="welcome-description"
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-[calc(100%-2rem)] max-w-lg",
            "rounded-2xl bg-ivory-100 shadow-xl border border-ivory-600",
            "p-6 sm:p-8",
            "animate-in fade-in slide-in-from-bottom-4 duration-300",
            "focus:outline-none",
            className
          )}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-100 mb-4">
              <BookOpen className="w-8 h-8 text-sage-600" aria-hidden="true" />
            </div>
            <Dialog.Title
              id="welcome-title"
              className="text-2xl sm:text-3xl font-heading font-semibold text-ink-800 mb-2"
            >
              Welcome to State of Clarity
            </Dialog.Title>
            <Dialog.Description
              id="welcome-description"
              className="text-ink-600 font-body text-base"
            >
              Evidence-based policy analysis for everyone
            </Dialog.Description>
          </div>

          {/* Mission Points */}
          <div className="space-y-4 mb-8">
            <MissionPoint
              icon={<Search className="w-5 h-5" aria-hidden="true" />}
              title="We pursue informed truth"
              description="We're laser-focused on evidence-based analysis, not viral hot takes or echo chambers."
            />
            <MissionPoint
              icon={<BookOpen className="w-5 h-5" aria-hidden="true" />}
              title="We provide thoughtful depth"
              description="Every question gets a detailed, digestible answer – not lazy quick takes."
            />
            <MissionPoint
              icon={<Shield className="w-5 h-5" aria-hidden="true" />}
              title="We don't pick sides"
              description="We're non-partisan and committed to rigorous truth-seeking, not false balance."
            />
            <MissionPoint
              icon={<Users className="w-5 h-5" aria-hidden="true" />}
              title="We show our sources"
              description="Every claim is linked to its source with credibility scores – verify for yourself."
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              ref={getStartedRef}
              onClick={handleClose}
              className={cn(
                "w-full py-3 px-6 rounded-lg",
                "bg-sage-500 text-ivory-100 font-ui font-semibold text-base",
                "hover:bg-sage-600 active:bg-sage-700",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100",
                "inline-flex items-center justify-center gap-2"
              )}
            >
              Get Started
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
            <Link
              href="/about"
              onClick={handleClose}
              className={cn(
                "w-full py-2.5 px-6 rounded-lg text-center",
                "border border-ivory-600 bg-ivory-100 text-ink-700 font-ui font-medium text-sm",
                "hover:bg-ivory-200 hover:border-ivory-700",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100"
              )}
            >
              Learn More About Us
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface MissionPointProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function MissionPoint({ icon, title, description }: MissionPointProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-ivory-300 flex items-center justify-center text-sage-600">
        {icon}
      </div>
      <div>
        <h3 className="font-ui font-semibold text-ink-800 text-sm mb-0.5">
          {title}
        </h3>
        <p className="font-body text-ink-600 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
