"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Camera,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download,
  Trash2,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";

type ReadingLevel = "child" | "teen" | "undergrad" | "postdoc";
type NotificationPreferences = { email: boolean; push: boolean };

const READING_LEVELS: { value: ReadingLevel; label: string; description: string }[] = [
  { value: "child", label: "Child (Ages 8–12)", description: "Simple language, relatable examples" },
  { value: "teen", label: "Teen (Ages 13–17)", description: "More context, balanced detail" },
  { value: "undergrad", label: "Undergrad (Ages 18–22)", description: "Standard depth and terminology" },
  { value: "postdoc", label: "Postdoc (Graduate researchers)", description: "Full technical depth" },
];

const TOPIC_OPTIONS = [
  "Climate & Environment",
  "Economics & Finance",
  "Education",
  "Energy Policy",
  "Foreign Policy",
  "Healthcare",
  "Housing",
  "Immigration",
  "Labor & Employment",
  "National Security",
  "Political Philosophy",
  "Science & Technology",
  "Social Policy",
  "Trade",
  "Transport & Infrastructure",
];

interface ProfileData {
  display_name: string;
  avatar_url: string;
  preferred_reading_level: ReadingLevel | null;
  topics_of_interest: string[];
  notification_preferences: NotificationPreferences;
  anonymous_posting: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    avatar_url: "",
    preferred_reading_level: null,
    topics_of_interest: [],
    notification_preferences: { email: true, push: false },
    anonymous_posting: false,
  });

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setUserId(user.id);

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select(
          "display_name, avatar_url, preferred_reading_level, topics_of_interest, notification_preferences, anonymous_posting"
        )
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (data) {
        const profileData = data as {
          display_name: string | null;
          avatar_url: string | null;
          preferred_reading_level: string | null;
          topics_of_interest: string[] | null;
          notification_preferences: NotificationPreferences | null;
          anonymous_posting: boolean | null;
        };
        setProfile({
          display_name:
            profileData.display_name || user.user_metadata?.full_name || "",
          avatar_url:
            profileData.avatar_url || user.user_metadata?.avatar_url || "",
          preferred_reading_level:
            (profileData.preferred_reading_level as ReadingLevel) || null,
          topics_of_interest: Array.isArray(profileData.topics_of_interest)
            ? profileData.topics_of_interest
            : [],
          notification_preferences:
            typeof profileData.notification_preferences === "object" &&
            profileData.notification_preferences !== null
              ? profileData.notification_preferences
              : { email: true, push: false },
          anonymous_posting: profileData.anonymous_posting || false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!userId) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData = {
        display_name: profile.display_name || null,
        avatar_url: profile.avatar_url || null,
        preferred_reading_level: profile.preferred_reading_level,
        topics_of_interest: profile.topics_of_interest,
        notification_preferences: profile.notification_preferences,
        anonymous_posting: profile.anonymous_posting,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from("profiles") as any)
        .update(updateData)
        .eq("id", userId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTopicToggle = (topic: string) => {
    setProfile((prev) => ({
      ...prev,
      topics_of_interest: prev.topics_of_interest.includes(topic)
        ? prev.topics_of_interest.filter((t) => t !== topic)
        : [...prev.topics_of_interest, topic],
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sage-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Header */}
      <header className="border-b border-ivory-600 bg-ivory-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="flex items-center gap-2 text-ink-500 hover:text-ink-800 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg p-1"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Back to profile</span>
            </Link>
            <h1 className="text-xl font-heading font-bold text-ink-800">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-light border border-error/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
            <p className="text-sm text-error-dark font-ui">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-success-light border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-sm text-success-dark font-ui">
              Settings saved successfully
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Profile Section */}
          <section className="bg-ivory-50 rounded-xl border border-ivory-600 p-6">
            <h2 className="text-lg font-heading font-semibold text-ink-800 mb-4">Profile</h2>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-ivory-200 flex items-center justify-center overflow-hidden border-2 border-ivory-500">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-ink-400" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-sage-500 text-ivory-100 flex items-center justify-center cursor-pointer hover:bg-sage-600 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-ui font-medium text-ink-800 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, display_name: e.target.value }))
                  }
                  placeholder="Your display name"
                  className="w-full px-4 py-2 rounded-lg border border-ivory-600 bg-ivory-100 text-ink-800 font-ui focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus:border-sage-500 outline-none transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Reading Preferences */}
          <section className="bg-ivory-50 rounded-xl border border-ivory-600 p-6">
            <h2 className="text-lg font-heading font-semibold text-ink-800 mb-4">Reading Preferences</h2>

            <div className="mb-6">
              <label className="block text-sm font-ui font-medium text-ink-800 mb-2">
                Default Reading Level
              </label>
              <select
                value={profile.preferred_reading_level || ""}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    preferred_reading_level:
                      (e.target.value as ReadingLevel) || null,
                  }))
                }
                className="w-full px-4 py-2 rounded-lg border border-ivory-600 bg-ivory-100 text-ink-800 font-ui focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus:border-sage-500 outline-none transition-colors"
              >
                <option value="">No preference</option>
                {READING_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-ink-500 font-ui">
                Briefs will open at this reading level by default.
              </p>
            </div>

            <div>
              <label className="block text-sm font-ui font-medium text-ink-800 mb-2">
                Topics of Interest
              </label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_OPTIONS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicToggle(topic)}
                    className={`px-3 py-1.5 rounded-full text-sm font-ui font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
                      profile.topics_of_interest.includes(topic)
                        ? "bg-sage-500 text-ivory-100"
                        : "bg-ivory-200 text-ink-600 hover:bg-ivory-300 border border-ivory-500"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-ink-500 font-ui">
                Select topics to personalize your brief recommendations.
              </p>
            </div>
          </section>

          {/* Privacy & Notifications */}
          <section className="bg-ivory-50 rounded-xl border border-ivory-600 p-6">
            <h2 className="text-lg font-heading font-semibold text-ink-800 mb-4">Privacy & Notifications</h2>

            <div className="space-y-4">
              {/* Anonymous Posting */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-ui font-medium text-ink-800">Anonymous Posting</p>
                  <p className="text-sm text-ink-500 font-ui">
                    Your name will be hidden on public feedback and comments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      anonymous_posting: !prev.anonymous_posting,
                    }))
                  }
                  role="switch"
                  aria-checked={profile.anonymous_posting}
                  className={`relative w-12 h-6 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
                    profile.anonymous_posting
                      ? "bg-sage-500"
                      : "bg-ivory-400"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ivory-50 shadow-sm transition-transform ${
                      profile.anonymous_posting ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-ui font-medium text-ink-800">Email Notifications</p>
                  <p className="text-sm text-ink-500 font-ui">
                    Receive updates about your briefs and activity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      notification_preferences: {
                        ...prev.notification_preferences,
                        email: !prev.notification_preferences.email,
                      },
                    }))
                  }
                  role="switch"
                  aria-checked={profile.notification_preferences.email}
                  className={`relative w-12 h-6 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
                    profile.notification_preferences.email
                      ? "bg-sage-500"
                      : "bg-ivory-400"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ivory-50 shadow-sm transition-transform ${
                      profile.notification_preferences.email
                        ? "translate-x-6"
                        : ""
                    }`}
                  />
                </button>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-ui font-medium text-ink-800">Push Notifications</p>
                  <p className="text-sm text-ink-500 font-ui">
                    Get notified in your browser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      notification_preferences: {
                        ...prev.notification_preferences,
                        push: !prev.notification_preferences.push,
                      },
                    }))
                  }
                  role="switch"
                  aria-checked={profile.notification_preferences.push}
                  className={`relative w-12 h-6 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
                    profile.notification_preferences.push
                      ? "bg-sage-500"
                      : "bg-ivory-400"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ivory-50 shadow-sm transition-transform ${
                      profile.notification_preferences.push
                        ? "translate-x-6"
                        : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Data Section */}
          <section className="bg-ivory-50 rounded-xl border border-ivory-600 p-6">
            <h2 className="text-lg font-heading font-semibold text-ink-800 mb-4">Your Data</h2>
            
            <div className="space-y-4">
              <a
                href="/api/profile/export"
                className="flex items-center gap-3 p-4 rounded-lg border border-ivory-600 bg-ivory-100 hover:bg-ivory-200 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                <Download className="w-5 h-5 text-sage-500" />
                <div>
                  <p className="font-ui font-medium text-ink-800">Export my data</p>
                  <p className="text-sm text-ink-500 font-ui">Download all your data in JSON format</p>
                </div>
              </a>

              <Link
                href="/settings/delete-account"
                className="flex items-center gap-3 p-4 rounded-lg border border-error/30 bg-error-light hover:bg-error-light/80 transition-colors focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
              >
                <Trash2 className="w-5 h-5 text-error" />
                <div>
                  <p className="font-ui font-medium text-error-dark">Delete my account</p>
                  <p className="text-sm text-error-dark/70 font-ui">Permanently delete your account and all data</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 rounded-lg bg-sage-500 text-ivory-100 font-ui font-medium hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
