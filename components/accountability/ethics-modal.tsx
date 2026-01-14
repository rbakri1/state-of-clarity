"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EthicsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetEntity: string;
}

export default function EthicsModal({
  open,
  onOpenChange,
  targetEntity,
}: EthicsModalProps) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);

  const handleProceed = () => {
    if (!acknowledged) return;
    const encodedEntity = encodeURIComponent(targetEntity.trim());
    router.push(`/accountability/generate?entity=${encodedEntity}`);
    onOpenChange(false);
    setAcknowledged(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setAcknowledged(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          aria-modal="true"
          aria-labelledby="ethics-title"
          aria-describedby="ethics-description"
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-[calc(100%-2rem)] max-w-2xl",
            "rounded-2xl bg-ivory-100 shadow-xl border border-ivory-600",
            "p-6 sm:p-8",
            "animate-in fade-in slide-in-from-bottom-4 duration-300",
            "focus:outline-none"
          )}
        >
          <Dialog.Close className="absolute right-4 top-4 p-2 rounded-lg text-ink-500 hover:text-ink-700 hover:bg-ivory-200 transition-colors">
            <X className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning-light mb-4">
              <AlertTriangle className="w-8 h-8 text-warning-dark" aria-hidden="true" />
            </div>
            <Dialog.Title
              id="ethics-title"
              className="text-2xl font-heading font-semibold text-ink-800 mb-2"
            >
              Ethics Acknowledgment
            </Dialog.Title>
            <Dialog.Description
              id="ethics-description"
              className="text-ink-600 font-body text-base"
            >
              You are about to investigate: <strong>{targetEntity}</strong>
            </Dialog.Description>
          </div>

          <div className="space-y-4 mb-6 text-left">
            <p className="font-body text-ink-700 text-sm">
              Please read and understand these ethical principles:
            </p>
            <ul className="space-y-2 text-sm font-body text-ink-600">
              <li className="flex gap-2">
                <span className="text-sage-600">•</span>
                Innocent until proven guilty
              </li>
              <li className="flex gap-2">
                <span className="text-sage-600">•</span>
                Correlation does not equal causation
              </li>
              <li className="flex gap-2">
                <span className="text-sage-600">•</span>
                This tool maps theoretical possibilities, NOT confirmed wrongdoing
              </li>
              <li className="flex gap-2">
                <span className="text-sage-600">•</span>
                All findings must be verified through traditional investigative methods
              </li>
              <li className="flex gap-2">
                <span className="text-sage-600">•</span>
                Use responsibly and ethically for legitimate journalism only
              </li>
            </ul>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-ivory-600 text-sage-500 focus:ring-sage-500"
            />
            <span className="text-sm font-body text-ink-700">
              I understand these principles and will use this tool ethically for legitimate investigative journalism purposes.
            </span>
          </label>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleProceed}
              disabled={!acknowledged}
              className={cn(
                "w-full py-3 px-6 rounded-lg",
                "font-ui font-semibold text-base",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                acknowledged
                  ? "bg-sage-500 text-ivory-100 hover:bg-sage-600 active:bg-sage-700"
                  : "bg-ivory-300 text-ink-400 cursor-not-allowed"
              )}
            >
              Proceed with Investigation
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                "w-full py-2.5 px-6 rounded-lg text-center",
                "border border-ivory-600 bg-ivory-100 text-ink-700 font-ui font-medium text-sm",
                "hover:bg-ivory-200 hover:border-ivory-700",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              )}
            >
              Cancel
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
