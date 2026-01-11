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
        .select("preferred_reading_level, topic_interests")
        .eq("id", user.id)
        .single();

      const profile = profileData as { 
        preferred_reading_level: string | null;
        topic_interests: string[] | null;
      } | null;
      
      if (profile?.preferred_reading_level) {
        setReadingLevel(profile.preferred_reading_level as ReadingLevel);
      }
      if (profile?.topic_interests) {
        setTopicInterests(profile.topic_interests);
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
            <p className="text-muted-foreground text-sm">
              Control how and when we contact you.
            </p>
            <div className="text-sm text-muted-foreground italic">
              Notification settings coming soon...
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
            <div className="text-sm text-muted-foreground italic">
              Connected accounts coming soon...
            </div>
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
            <div className="text-sm text-muted-foreground italic">
              Data & privacy options coming soon...
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
