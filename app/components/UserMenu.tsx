"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Bookmark,
  History,
  LogOut,
  ChevronDown,
  Coins,
} from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { createBrowserClient } from "@/lib/supabase/browser";
import { useAuthModal } from "@/app/components/auth/AuthModal";
import { useSavedBriefs } from "@/lib/saved-briefs/useSavedBriefs";

interface UserProfile {
  id: string;
  email: string | undefined;
  displayName: string;
  avatarUrl: string | null;
}

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { openModal } = useAuthModal();
  const { savedCount } = useSavedBriefs();

  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        Sentry.setUser(null);
        setIsLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", authUser.id)
        .single();

      const displayName =
        profile?.display_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split("@")[0] ||
        "User";

      setUser({
        id: authUser.id,
        email: authUser.email,
        displayName,
        avatarUrl: profile?.avatar_url ?? null,
      });
      
      Sentry.setUser({
        id: authUser.id,
        email: authUser.email,
      });
      
      setIsLoading(false);
    }

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    Sentry.setUser(null);
    setIsOpen(false);
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => openModal("signin")}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
          {user.displayName}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="font-medium truncate">{user.displayName}</p>
            {user.email && (
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            )}
          </div>

          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="w-4 h-4" />
              <span>Credits: </span>
              <span className="font-medium text-foreground">—</span>
              <span className="text-xs">(coming soon)</span>
            </div>
          </div>

          <nav className="py-2">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <Link
              href="/saved"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Briefs</span>
              {savedCount > 0 && (
                <span className="ml-auto bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  {savedCount}
                </span>
              )}
            </Link>

            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Link>
          </nav>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
