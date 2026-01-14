"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import EthicsModal from "@/components/accountability/ethics-modal";

export default function AccountabilityPage() {
  const [targetEntity, setTargetEntity] = useState("");
  const [showEthicsModal, setShowEthicsModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetEntity.trim()) {
      setShowEthicsModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-100">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-semibold text-ink-800 mb-4">
            Accountability Tracker
          </h1>
          <p className="font-body text-ink-600 text-lg">
            Systematically investigate potential corruption using UK public records.
            Evidence-based. Transparent. Ethical.
          </p>
        </div>

        <div className="mb-8 p-4 rounded-lg bg-warning-light border border-warning flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
          <p className="font-ui text-sm text-warning-dark">
            This tool is for investigative journalism only. Remember: innocent until proven guilty.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={targetEntity}
            onChange={(e) => setTargetEntity(e.target.value)}
            placeholder="Enter name or organization to investigate..."
            required
            className="w-full px-4 py-4 rounded-xl border border-ivory-600 bg-ivory-50 text-ink-800 font-body placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-sage-500 text-ivory-100 font-ui font-medium hover:bg-sage-600 transition-colors duration-200"
          >
            Start Investigation (£9.99)
          </button>
        </form>
      </main>

      <EthicsModal
        open={showEthicsModal}
        onOpenChange={setShowEthicsModal}
        targetEntity={targetEntity}
      />
    </div>
  );
}
