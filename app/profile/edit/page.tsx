"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, ArrowLeft, Check, AlertCircle, Upload, X } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface FormErrors {
  full_name?: string;
  username?: string;
  bio?: string;
  location?: string;
  avatar?: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const fetchedProfile = profileData as Profile | null;
      if (fetchedProfile) {
        setProfile(fetchedProfile);
        setFullName(fetchedProfile.full_name || "");
        setUsername(fetchedProfile.username || "");
        setBio(fetchedProfile.bio || "");
        setLocation(fetchedProfile.location || "");
      } else {
        setFullName(user.user_metadata?.full_name || "");
      }

      setIsLoading(false);
    };

    fetchProfileData();
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      newErrors.username =
        "Username must be 3-20 characters and contain only letters, numbers, and underscores";
    }

    if (bio && bio.length > 280) {
      newErrors.bio = `Bio must be 280 characters or less (${bio.length}/280)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setApiError(null);
    setShowSuccess(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName || null,
          username: username || null,
          bio: bio || null,
          location: location || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || "Failed to save profile");
        return;
      }

      setProfile(data.profile);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Invalid file type. Allowed: JPG, PNG, GIF, WebP",
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        avatar: "File too large. Maximum size is 2MB",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, avatar: undefined }));
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setIsUploadingAvatar(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || "Failed to upload avatar");
        return;
      }

      setProfile(data.profile);
      setAvatarFile(null);
      setAvatarPreview(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const cancelAvatarPreview = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setErrors((prev) => ({ ...prev, avatar: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = fullName || profile?.full_name || user?.user_metadata?.full_name || "Anonymous";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to profile
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        {showSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">
              Profile saved successfully
            </span>
          </div>
        )}

        {apiError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{apiError}</span>
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-medium mb-3">Profile Photo</label>
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-600">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={cancelAvatarPreview}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-medium">{displayName}</p>
              <input
                ref={fileInputRef}
                type="file"
                id="avatar"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
              />
              {avatarPreview ? (
                <button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </>
                  )}
                </button>
              ) : (
                <label
                  htmlFor="avatar"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Choose Photo
                </label>
              )}
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF, or WebP. Max 2MB.
              </p>
              {errors.avatar && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.avatar}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium mb-2"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              placeholder="Your name"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.full_name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-2"
            >
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                className={`w-full pl-8 pr-4 py-3 rounded-lg border ${
                  errors.username
                    ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 dark:border-gray-700 focus:ring-primary/20 focus:border-primary"
                } bg-white dark:bg-gray-800 outline-none transition`}
                placeholder="username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.username}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setErrors((prev) => ({ ...prev, bio: undefined }));
              }}
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.bio
                  ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 dark:border-gray-700 focus:ring-primary/20 focus:border-primary"
              } bg-white dark:bg-gray-800 outline-none transition resize-none`}
              placeholder="Tell us about yourself"
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.bio}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {bio.length}/280
            </p>
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium mb-2"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              placeholder="City, Country"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.location}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <Link
            href="/profile"
            className="px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
