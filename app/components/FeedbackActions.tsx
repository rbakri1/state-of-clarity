"use client";

import { useState } from "react";
import { Link2, AlertTriangle, Edit3 } from "lucide-react";
import SuggestSourceModal from "./SuggestSourceModal";
import SpotErrorModal from "./SpotErrorModal";
import ProposeEditModal from "./ProposeEditModal";

interface FeedbackActionsProps {
  briefId: string;
}

export default function FeedbackActions({ briefId }: FeedbackActionsProps) {
  const [suggestSourceOpen, setSuggestSourceOpen] = useState(false);
  const [spotErrorOpen, setSpotErrorOpen] = useState(false);
  const [proposeEditOpen, setProposeEditOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSuggestSourceOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Link2 className="w-4 h-4" />
          <span className="hidden sm:inline">Suggest Source</span>
        </button>

        <button
          onClick={() => setSpotErrorOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden sm:inline">Spot Error</span>
        </button>

        <button
          onClick={() => setProposeEditOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">Propose Edit</span>
        </button>
      </div>

      <SuggestSourceModal
        briefId={briefId}
        open={suggestSourceOpen}
        onOpenChange={setSuggestSourceOpen}
      />

      <SpotErrorModal
        briefId={briefId}
        open={spotErrorOpen}
        onOpenChange={setSpotErrorOpen}
      />

      <ProposeEditModal
        briefId={briefId}
        open={proposeEditOpen}
        onOpenChange={setProposeEditOpen}
      />
    </>
  );
}
