"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, ArrowLeft, Check, AlertCircle, Upload, X, Loader2 } from "lucide-react";
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
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sage-300 border-t-sage-500 rounded-full animate-spin" />
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = fullName || profile?.full_name || user?.user_metadata?.full_name || "Anonymous";

  return (
    <div className="min-h-screen bg-ivory-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-ink-500 hover:text-ink-800 font-ui mb-6 focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-lg p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>

        <div className="bg-ivory-50 rounded-2xl shadow-sm border border-ivory-600 p-6">
          <h1 className="text-2xl font-heading font-bold text-ink-800 mb-6">Edit Profile</h1>

          {showSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-success-light border border-success/20 flex items-center gap-3">
              <Check className="w-5 h-5 text-success" />
              <span className="text-success-dark font-ui">
                Profile saved successfully
              </span>
            </div>
          )}

          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-error-light border border-error/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error" />
              <span className="text-error-dark font-ui">{apiError}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="mb-8">
            <label className="block text-sm font-ui font-medium text-ink-800 mb-3">Profile Photo</label>
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-ivory-200 overflow-hidden flex items-center justify-center ring-2 ring-ivory-500">
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
                    <User className="w-12 h-12 text-ink-400" />
                  )}
                </div>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={cancelAvatarPreview}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-error text-ivory-100 flex items-center justify-center hover:bg-error-dark transition-colors focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-ui font-medium text-ink-800">{displayName}</p>
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sage-500 text-ivory-100 font-ui font-medium text-sm hover:bg-sage-600 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ivory-600 bg-ivory-100 font-ui font-medium text-sm text-ink-800 hover:bg-ivory-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Photo
                  </label>
                )}
                <p className="text-xs text-ink-500 font-ui">
                  JPG, PNG, GIF, or WebP. Max 2MB.
                </p>
                {errors.avatar && (
                  <p className="text-sm text-error font-ui">
                    {errors.avatar}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-ui font-medium text-ink-800 mb-2"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-ivory-600 bg-ivory-100 text-ink-800 font-ui focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus:border-sage-500 outline-none transition-colors"
                placeholder="Your name"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-error font-ui">
                  {errors.full_name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-ui font-medium text-ink-800 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-ui">
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
                      ? "border-error focus:ring-error/20 focus:border-error"
                      : "border-ivory-600 focus:ring-sage-500/20 focus:border-sage-500"
                  } bg-ivory-100 text-ink-800 font-ui outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2`}
                  placeholder="username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-error font-ui">
                  {errors.username}
                </p>
              )}
              <p className="mt-1 text-xs text-ink-500 font-ui">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-ui font-medium text-ink-800 mb-2">
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
                    ? "border-error focus:ring-error/20 focus:border-error"
                    : "border-ivory-600 focus:ring-sage-500/20 focus:border-sage-500"
                } bg-ivory-100 text-ink-800 font-ui outline-none transition-colors resize-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                placeholder="Tell us about yourself"
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-error font-ui">
                  {errors.bio}
                </p>
              )}
              <p className="mt-1 text-xs text-ink-500 font-ui text-right tabular-nums">
                {bio.length}/280
              </p>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-ui font-medium text-ink-800 mb-2"
              >
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-ivory-600 bg-ivory-100 text-ink-800 font-ui focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus:border-sage-500 outline-none transition-colors"
                placeholder="City, Country"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-error font-ui">
                  {errors.location}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            <Link
              href="/profile"
              className="px-6 py-3 rounded-lg border border-ivory-600 bg-ivory-100 font-ui font-medium text-ink-800 hover:bg-ivory-200 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 rounded-lg bg-sage-500 text-ivory-100 font-ui font-medium hover:bg-sage-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
