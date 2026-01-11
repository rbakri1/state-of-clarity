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
  Sparkles,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  createBrowserClient,
  type ReadingLevel,
  type NotificationPreferences,
} from "@/lib/supabase/browser";

const READING_LEVELS: { value: ReadingLevel; label: string }[] = [
  { value: "simple", label: "Simple (Easy to understand)" },
  { value: "standard", label: "Standard (Balanced detail)" },
  { value: "advanced", label: "Advanced (Full technical depth)" },
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
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Settings</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-600 dark:text-green-400">
              Settings saved successfully!
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Profile Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:opacity-90 transition">
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
                <label className="block text-sm font-medium mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, display_name: e.target.value }))
                  }
                  placeholder="Your display name"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </div>
            </div>
          </section>

          {/* Reading Preferences */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Reading Preferences</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Preferred Reading Level
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
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              >
                <option value="">No preference</option>
                {READING_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-muted-foreground">
                Briefs will open at this reading level by default.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Topics of Interest
              </label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_OPTIONS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicToggle(topic)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      profile.topics_of_interest.includes(topic)
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Select topics to personalize your brief recommendations.
              </p>
            </div>
          </section>

          {/* Privacy & Notifications */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Privacy & Notifications</h2>

            <div className="space-y-4">
              {/* Anonymous Posting */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Anonymous Posting</p>
                  <p className="text-sm text-muted-foreground">
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
                  className={`relative w-12 h-6 rounded-full transition ${
                    profile.anonymous_posting
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      profile.anonymous_posting ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
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
                  className={`relative w-12 h-6 rounded-full transition ${
                    profile.notification_preferences.email
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
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
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
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
                  className={`relative w-12 h-6 rounded-full transition ${
                    profile.notification_preferences.push
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      profile.notification_preferences.push
                        ? "translate-x-6"
                        : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <Link
              href="/settings/delete-account"
              className="text-red-600 dark:text-red-400 hover:underline text-sm"
            >
              Delete my account
            </Link>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
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
