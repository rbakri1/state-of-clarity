"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

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
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Customize your reading experience and topic interests.
            </p>
            <div className="text-sm text-muted-foreground italic">
              Preference settings coming soon...
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
