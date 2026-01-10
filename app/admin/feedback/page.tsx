"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import {
  Sparkles,
  LinkIcon,
  AlertTriangle,
  Edit3,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  Flag,
} from "lucide-react";
import Link from "next/link";

type FeedbackType = "source_suggestion" | "error_report" | "edit_proposal";
type FeedbackStatus = "pending" | "approved" | "rejected" | "flagged";
type TabFilter = "all" | FeedbackStatus;

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  brief_id: string;
  brief_title: string;
  user_email: string;
  status: FeedbackStatus;
  created_at: string;
  ai_screening_result: {
    approved: boolean;
    flagged: boolean;
    reason?: string;
    confidence: number;
  } | null;
  content: Record<string, unknown>;
}

const ADMIN_EMAILS = ["admin@stateofclarity.com"];

export default function AdminFeedbackPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setUserEmail(user.email);
      const isAdminUser = ADMIN_EMAILS.includes(user.email) || user.email.endsWith("@stateofclarity.com");
      setIsAdmin(isAdminUser);

      if (!isAdminUser) {
        setIsLoading(false);
        return;
      }

      await fetchFeedback();
      setIsLoading(false);
    };

    checkAdminAndFetch();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch("/api/admin/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedbackItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case "source_suggestion":
        return <LinkIcon className="w-4 h-4" />;
      case "error_report":
        return <AlertTriangle className="w-4 h-4" />;
      case "edit_proposal":
        return <Edit3 className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case "source_suggestion":
        return "Source Suggestion";
      case "error_report":
        return "Error Report";
      case "edit_proposal":
        return "Edit Proposal";
    }
  };

  const getStatusIcon = (status: FeedbackStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "flagged":
        return <Flag className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusBadgeClass = (status: FeedbackStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "flagged":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    }
  };

  const filteredItems = feedbackItems.filter((item) =>
    activeTab === "all" ? true : item.status === activeTab
  );

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "flagged", label: "Flagged" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Admin - Feedback Review</span>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">State of Clarity</span>
            </Link>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You must be an admin to access this page.
            </p>
            {userEmail && (
              <p className="text-sm text-muted-foreground">
                Logged in as: {userEmail}
              </p>
            )}
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Admin - Feedback Review</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                {feedbackItems.filter((item) =>
                  tab.key === "all" ? true : item.status === tab.key
                ).length}
              </span>
            </button>
          ))}
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-muted-foreground">No feedback items found.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  onClick={() => toggleExpand(`${item.type}-${item.id}`)}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {getTypeIcon(item.type)}
                    <span className="text-xs font-medium">{getTypeLabel(item.type)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.brief_title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.user_email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {getStatusIcon(item.status)}
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>

                    {expandedIds.has(`${item.type}-${item.id}`) ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedIds.has(`${item.type}-${item.id}`) && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Feedback Content */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Feedback Content</h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(item.content).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium text-muted-foreground">
                                {key.replace(/_/g, " ")}:
                              </span>{" "}
                              <span className="break-words">
                                {typeof value === "string"
                                  ? value
                                  : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Screening Result */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">AI Screening Result</h4>
                        {item.ai_screening_result ? (
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Approved:
                              </span>{" "}
                              <span
                                className={
                                  item.ai_screening_result.approved
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {item.ai_screening_result.approved ? "Yes" : "No"}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Flagged:
                              </span>{" "}
                              <span
                                className={
                                  item.ai_screening_result.flagged
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }
                              >
                                {item.ai_screening_result.flagged ? "Yes" : "No"}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Confidence:
                              </span>{" "}
                              {(item.ai_screening_result.confidence * 100).toFixed(0)}%
                            </div>
                            {item.ai_screening_result.reason && (
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Reason:
                                </span>{" "}
                                {item.ai_screening_result.reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Not yet screened
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
