"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  MapPin,
  Calendar,
  FileText,
  Bookmark,
  MessageSquare,
  Edit,
  History,
  Settings,
  Download,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileStats {
  briefsGenerated: number;
  briefsSaved: number;
  feedbackCount: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    briefsGenerated: 0,
    briefsSaved: 0,
    feedbackCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    const fetchProfileData = async () => {
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
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const [briefsResult, savedResult, feedbackResult] = await Promise.all([
        supabase.from("briefs").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("saved_briefs").select("brief_id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("feedback").select("id", { count: "exact" }).eq("user_id", user.id),
      ]);

      setStats({
        briefsGenerated: briefsResult.count || 0,
        briefsSaved: savedResult.count || 0,
        feedbackCount: feedbackResult.count || 0,
      });

      setIsLoading(false);
    };

    fetchProfileData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sage-300 border-t-sage-500 rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Anonymous";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "";

  return (
    <div className="min-h-screen bg-ivory-100">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Profile Card */}
        <div className="bg-ivory-50 rounded-2xl shadow-sm overflow-hidden">
          {/* Header gradient */}
          <div className="h-28 sm:h-32 bg-gradient-to-br from-sage-500 via-sage-500 to-sage-600" />

          <div className="px-5 sm:px-8 pb-8">
            {/* Avatar and Name Section */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-20 sm:-mt-20">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-ivory-50 border-4 border-ivory-50 shadow-md overflow-hidden flex items-center justify-center flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-ivory-200 flex items-center justify-center">
                    <User className="w-14 h-14 sm:w-16 sm:h-16 text-sage-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 pt-2 sm:pt-0 sm:pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-0.5">
                    <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink-800">{displayName}</h1>
                    {user?.email && (
                      <p className="text-sm text-ink-500 font-ui">{user.email}</p>
                    )}
                    {profile?.username && (
                      <p className="text-ink-400 font-ui text-sm">@{profile.username}</p>
                    )}
                  </div>
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-ivory-200 text-ink-700 font-ui font-medium text-sm hover:bg-ivory-300 border border-ivory-500 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 self-start"
                  >
                    <Edit className="w-4 h-4" />
                    Edit profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="mt-4 text-ink-600 font-body">{profile.bio}</p>
            )}

            {/* Meta info */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-500 font-ui">
              {profile?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}
              {memberSince && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {memberSince}
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-5 rounded-xl bg-ivory-100">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-sage-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-bold text-ink-800">{stats.briefsGenerated}</div>
                <div className="text-xs sm:text-sm text-ink-500 font-ui mt-1">Briefs generated</div>
              </div>
              <div className="text-center p-3 sm:p-5 rounded-xl bg-ivory-100">
                <div className="flex items-center justify-center mb-2">
                  <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-sage-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-bold text-ink-800">{stats.briefsSaved}</div>
                <div className="text-xs sm:text-sm text-ink-500 font-ui mt-1">Briefs saved</div>
              </div>
              <div className="text-center p-3 sm:p-5 rounded-xl bg-ivory-100">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-sage-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-bold text-ink-800">{stats.feedbackCount}</div>
                <div className="text-xs sm:text-sm text-ink-500 font-ui mt-1">Feedback given</div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                href="/profile/saved"
                className="flex items-center gap-4 p-4 rounded-xl bg-ivory-100 hover:bg-ivory-200 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                <div className="w-11 h-11 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <Bookmark className="w-5 h-5 text-sage-600" />
                </div>
                <div>
                  <div className="font-ui font-semibold text-ink-800">Saved Briefs</div>
                  <div className="text-sm text-ink-500 font-ui">
                    View your bookmarked briefs
                  </div>
                </div>
              </Link>
              <Link
                href="/profile/history"
                className="flex items-center gap-4 p-4 rounded-xl bg-ivory-100 hover:bg-ivory-200 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
              >
                <div className="w-11 h-11 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <History className="w-5 h-5 text-sage-600" />
                </div>
                <div>
                  <div className="font-ui font-semibold text-ink-800">Reading History</div>
                  <div className="text-sm text-ink-500 font-ui">
                    See briefs you&apos;ve read
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Settings & Data Section */}
        <div className="mt-6 bg-ivory-50 rounded-2xl shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-heading font-semibold text-ink-800 mb-4">Account</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link
              href="/settings"
              className="flex items-center gap-4 p-4 rounded-xl bg-ivory-100 hover:bg-ivory-200 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            >
              <div className="w-11 h-11 rounded-xl bg-ivory-300 flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5 text-ink-600" />
              </div>
              <div>
                <div className="font-ui font-semibold text-ink-800">Settings</div>
                <div className="text-sm text-ink-500 font-ui">
                  Preferences and notifications
                </div>
              </div>
            </Link>
            <a
              href="/api/profile/export"
              className="flex items-center gap-4 p-4 rounded-xl bg-ivory-100 hover:bg-ivory-200 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            >
              <div className="w-11 h-11 rounded-xl bg-ivory-300 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-ink-600" />
              </div>
              <div>
                <div className="font-ui font-semibold text-ink-800">Export My Data</div>
                <div className="text-sm text-ink-500 font-ui">
                  Download all your data
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
