"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Sliders,
  Bell,
  Link2,
  Shield,
  ChevronDown,
  ChevronUp,
  Check,
  DollarSign,
  Heart,
  Leaf,
  GraduationCap,
  Users,
  Home,
  Scale,
  Cpu,
  Landmark,
  Download,
  Loader2,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type ReadingLevel = "simple" | "standard" | "advanced";

interface TopicCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const TOPIC_CATEGORIES: TopicCategory[] = [
  { id: "economy", label: "Economy", icon: <DollarSign className="w-4 h-4" /> },
  { id: "healthcare", label: "Healthcare", icon: <Heart className="w-4 h-4" /> },
  { id: "climate", label: "Climate", icon: <Leaf className="w-4 h-4" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "defense", label: "Defense", icon: <Shield className="w-4 h-4" /> },
  { id: "immigration", label: "Immigration", icon: <Users className="w-4 h-4" /> },
  { id: "housing", label: "Housing", icon: <Home className="w-4 h-4" /> },
  { id: "justice", label: "Justice", icon: <Scale className="w-4 h-4" /> },
  { id: "technology", label: "Technology", icon: <Cpu className="w-4 h-4" /> },
  { id: "governance", label: "Governance", icon: <Landmark className="w-4 h-4" /> },
];

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <span className="font-medium text-lg">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("standard");
  const [isSavingReadingLevel, setIsSavingReadingLevel] = useState(false);
  const [readingLevelSaved, setReadingLevelSaved] = useState(false);
  const [topicInterests, setTopicInterests] = useState<string[]>([]);
  const [isSavingTopics, setIsSavingTopics] = useState(false);
  const [topicsSaved, setTopicsSaved] = useState(false);
  const topicsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [emailDigest, setEmailDigest] = useState(false);
  const [newFeatures, setNewFeatures] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const saveTopicInterests = useCallback(async (interests: string[]) => {
    setIsSavingTopics(true);
    setTopicsSaved(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_interests: interests }),
      });

      if (response.ok) {
        setTopicsSaved(true);
        setTimeout(() => setTopicsSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save topic interests:", error);
    } finally {
      setIsSavingTopics(false);
    }
  }, []);

  const handleTopicToggle = useCallback((topicId: string) => {
    setTopicInterests((prev) => {
      const newInterests = prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId];

      if (topicsSaveTimeoutRef.current) {
        clearTimeout(topicsSaveTimeoutRef.current);
      }
      topicsSaveTimeoutRef.current = setTimeout(() => {
        saveTopicInterests(newInterests);
      }, 500);

      return newInterests;
    });
  }, [saveTopicInterests]);

  const handleNotificationToggle = async (
    field: "notification_email_digest" | "notification_new_features",
    value: boolean
  ) => {
    if (field === "notification_email_digest") {
      setEmailDigest(value);
    } else {
      setNewFeatures(value);
    }

    setIsSavingNotifications(true);
    setNotificationsSaved(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        setNotificationsSaved(true);
        setTimeout(() => setNotificationsSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save notification setting:", error);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  useEffect(() => {
    return () => {
      if (topicsSaveTimeoutRef.current) {
        clearTimeout(topicsSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient();

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("preferred_reading_level, topic_interests, notification_email_digest, notification_new_features")
        .eq("id", user.id)
        .single();

      const profile = profileData as { 
        preferred_reading_level: string | null;
        topic_interests: string[] | null;
        notification_email_digest: boolean | null;
        notification_new_features: boolean | null;
      } | null;
      
      if (profile?.preferred_reading_level) {
        setReadingLevel(profile.preferred_reading_level as ReadingLevel);
      }
      if (profile?.topic_interests) {
        setTopicInterests(profile.topic_interests);
      }
      if (profile?.notification_email_digest !== null && profile?.notification_email_digest !== undefined) {
        setEmailDigest(profile.notification_email_digest);
      }
      if (profile?.notification_new_features !== null && profile?.notification_new_features !== undefined) {
        setNewFeatures(profile.notification_new_features);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleReadingLevelChange = async (newLevel: ReadingLevel) => {
    setReadingLevel(newLevel);
    setIsSavingReadingLevel(true);
    setReadingLevelSaved(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_reading_level: newLevel }),
      });

      if (response.ok) {
        setReadingLevelSaved(true);
        setTimeout(() => setReadingLevelSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save reading level:", error);
    } finally {
      setIsSavingReadingLevel(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      const response = await fetch("/api/profile/export");

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `state-of-clarity-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to profile
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-4">
        <CollapsibleSection
          title="Preferences"
          icon={<Sliders className="w-5 h-5 text-primary" />}
          defaultOpen
        >
          <div className="space-y-6">
            <p className="text-muted-foreground text-sm">
              Customize your reading experience and topic interests.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reading-level"
                  className="text-sm font-medium"
                >
                  Preferred Reading Level
                </label>
                {readingLevelSaved && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Saved
                  </span>
                )}
                {isSavingReadingLevel && (
                  <span className="text-xs text-muted-foreground">
                    Saving...
                  </span>
                )}
              </div>
              <select
                id="reading-level"
                value={readingLevel}
                onChange={(e) =>
                  handleReadingLevelChange(e.target.value as ReadingLevel)
                }
                disabled={isSavingReadingLevel}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                <option value="simple">Simple</option>
                <option value="standard">Standard</option>
                <option value="advanced">Advanced</option>
              </select>
              <p className="text-xs text-muted-foreground">
                This will be your default reading level when viewing briefs.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Topic Interests</label>
                {topicsSaved && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Saved
                  </span>
                )}
                {isSavingTopics && (
                  <span className="text-xs text-muted-foreground">
                    Saving...
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {TOPIC_CATEGORIES.map((topic) => {
                  const isSelected = topicInterests.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleTopicToggle(topic.id)}
                      className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                        transition-all duration-200 border
                        ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-gray-300 dark:border-gray-600 hover:border-primary/50"
                        }
                      `}
                    >
                      {topic.icon}
                      {topic.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Select topics you're interested in to personalize your experience.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Notifications"
          icon={<Bell className="w-5 h-5 text-primary" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Control how and when we contact you.
              </p>
              {notificationsSaved && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
              {isSavingNotifications && (
                <span className="text-xs text-muted-foreground">
                  Saving...
                </span>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <div>
                  <span className="text-sm font-medium">Weekly digest of new briefs</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receive a weekly email with highlights of new briefs on your interested topics
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailDigest}
                  onClick={() => handleNotificationToggle("notification_email_digest", !emailDigest)}
                  disabled={isSavingNotifications}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${emailDigest ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${emailDigest ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <div>
                  <span className="text-sm font-medium">New feature announcements</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Be the first to know about new features and improvements
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={newFeatures}
                  onClick={() => handleNotificationToggle("notification_new_features", !newFeatures)}
                  disabled={isSavingNotifications}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${newFeatures ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${newFeatures ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </label>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Connected Accounts"
          icon={<Link2 className="w-5 h-5 text-primary" />}
        >
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Manage your connected social accounts.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Google</span>
                </div>
                {user?.identities?.some((identity) => identity.provider === "google") ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                    <Check className="w-3 h-3" />
                    Connected
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not connected</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Apple</span>
                </div>
                {user?.identities?.some((identity) => identity.provider === "apple") ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                    <Check className="w-3 h-3" />
                    Connected
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not connected</span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Need to disconnect an account? <a href="mailto:support@stateofclarity.com" className="text-primary hover:underline">Contact support</a>
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Data & Privacy"
          icon={<Shield className="w-5 h-5 text-primary" />}
        >
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Export your data or delete your account.
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Export my data</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Download a copy of all your data including your profile, saved briefs, reading history, and feedback.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Delete account</h4>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Link
                    href="/settings/delete-account"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium whitespace-nowrap"
                  >
                    Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
