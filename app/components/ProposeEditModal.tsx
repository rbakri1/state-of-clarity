"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Edit3, CheckCircle } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";

interface ProposeEditModalProps {
  briefId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SECTION_OPTIONS = [
  { value: "", label: "Select section..." },
  { value: "summary", label: "Summary" },
  { value: "narrative", label: "Narrative" },
  { value: "structured_data", label: "Structured Data" },
];

const MIN_CHAR_LENGTH = 20;

export default function ProposeEditModal({
  briefId,
  open,
  onOpenChange,
}: ProposeEditModalProps) {
  const [section, setSection] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [proposedText, setProposedText] = useState("");
  const [rationale, setRationale] = useState("");
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
    setSection("");
    setOriginalText("");
    setProposedText("");
    setRationale("");
    setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!section) {
      setSubmitError("Please select a section");
      return;
    }

    if (originalText.length < MIN_CHAR_LENGTH) {
      setSubmitError(`Original text must be at least ${MIN_CHAR_LENGTH} characters`);
      return;
    }

    if (proposedText.length < MIN_CHAR_LENGTH) {
      setSubmitError(`Proposed text must be at least ${MIN_CHAR_LENGTH} characters`);
      return;
    }

    if (rationale.length < MIN_CHAR_LENGTH) {
      setSubmitError(`Rationale must be at least ${MIN_CHAR_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/briefs/${briefId}/propose-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          original_text: originalText,
          proposed_text: proposedText,
          rationale,
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
        setSubmitError(data.error || "Failed to submit proposal");
      }
    } catch {
      setSubmitError("Failed to submit proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    section &&
    originalText.length >= MIN_CHAR_LENGTH &&
    proposedText.length >= MIN_CHAR_LENGTH &&
    rationale.length >= MIN_CHAR_LENGTH;

  const getCharCountColor = (length: number) =>
    length >= MIN_CHAR_LENGTH
      ? "text-green-600 dark:text-green-400"
      : "text-gray-500 dark:text-gray-400";

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Proposal Submitted!
              </Dialog.Title>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Thank you for helping improve this brief.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-500" />
                  Propose an Edit
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
                    Please sign in to propose an edit.
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
                      htmlFor="section"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="section"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    >
                      {SECTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor="originalText"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Original Text <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-xs ${getCharCountColor(originalText.length)}`}>
                        {originalText.length}/{MIN_CHAR_LENGTH} min
                      </span>
                    </div>
                    <textarea
                      id="originalText"
                      value={originalText}
                      onChange={(e) => setOriginalText(e.target.value)}
                      placeholder="Copy the original text you want to change..."
                      rows={3}
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor="proposedText"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Proposed Text <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-xs ${getCharCountColor(proposedText.length)}`}>
                        {proposedText.length}/{MIN_CHAR_LENGTH} min
                      </span>
                    </div>
                    <textarea
                      id="proposedText"
                      value={proposedText}
                      onChange={(e) => setProposedText(e.target.value)}
                      placeholder="Write your improved version of the text..."
                      rows={3}
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor="rationale"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Rationale <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-xs ${getCharCountColor(rationale.length)}`}>
                        {rationale.length}/{MIN_CHAR_LENGTH} min
                      </span>
                    </div>
                    <textarea
                      id="rationale"
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      placeholder="Explain why this change improves the brief..."
                      rows={3}
                      className="w-full px-3 py-2 border border-ivory-600 dark:border-gray-600 rounded-lg bg-ivory-50 dark:bg-gray-800 text-ink-800 dark:text-white resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
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
                        ? "bg-sage-500 text-white hover:bg-sage-600"
                        : "bg-ivory-400 dark:bg-gray-700 text-ink-400 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Edit Proposal"}
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
