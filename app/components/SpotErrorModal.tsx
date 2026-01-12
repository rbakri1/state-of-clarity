"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle, CheckCircle } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";

interface SpotErrorModalProps {
  briefId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ERROR_TYPE_OPTIONS = [
  { value: "", label: "Select error type..." },
  { value: "factual", label: "Factual Error" },
  { value: "outdated", label: "Outdated Info" },
  { value: "misleading", label: "Misleading Statement" },
  { value: "other", label: "Other" },
];

const MIN_DESCRIPTION_LENGTH = 20;

export default function SpotErrorModal({
  briefId,
  open,
  onOpenChange,
}: SpotErrorModalProps) {
  const [errorType, setErrorType] = useState("");
  const [description, setDescription] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const checkAuth = async () => {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      checkAuth();
      setShowSuccess(false);
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const resetForm = () => {
    setErrorType("");
    setDescription("");
    setLocationHint("");
    setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!errorType) {
      setSubmitError("Please select an error type");
      return;
    }

    if (description.length < MIN_DESCRIPTION_LENGTH) {
      setSubmitError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/briefs/${briefId}/report-error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error_type: errorType,
          description,
          location_hint: locationHint || undefined,
        }),
      });

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          setShowSuccess(false);
          resetForm();
        }, 1500);
      } else {
        const data = await res.json();
        setSubmitError(data.error || "Failed to submit report");
      }
    } catch {
      setSubmitError("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = errorType && description.length >= MIN_DESCRIPTION_LENGTH;
  const charCount = description.length;
  const charCountColor = charCount >= MIN_DESCRIPTION_LENGTH 
    ? "text-green-600 dark:text-green-400" 
    : "text-gray-500 dark:text-gray-400";

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                Report Submitted!
              </Dialog.Title>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Thank you for helping improve accuracy.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Report an Error
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              {isAuthenticated === false ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please sign in to report an error.
                  </p>
                  <a
                    href="/auth/signin"
                    className="inline-block px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  >
                    Sign In
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="errorType"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Error Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="errorType"
                      value={errorType}
                      onChange={(e) => setErrorType(e.target.value)}
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    >
                      {ERROR_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Description <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-xs ${charCountColor}`}>
                        {charCount}/{MIN_DESCRIPTION_LENGTH} min
                      </span>
                    </div>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the error you found in detail..."
                      rows={4}
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="locationHint"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Location Hint
                    </label>
                    <input
                      type="text"
                      id="locationHint"
                      value={locationHint}
                      onChange={(e) => setLocationHint(e.target.value)}
                      placeholder="e.g., In the summary, third paragraph"
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    />
                  </div>

                  {submitError && (
                    <p className="text-red-500 text-sm">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className={`w-full py-2.5 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
                      isValid && !isSubmitting
                        ? "bg-rust-500 text-white hover:bg-rust-600"
                        : "bg-ivory-400 dark:bg-gray-700 text-ink-400 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </form>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
