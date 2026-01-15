"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, Menu, X, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
      setIsUserMenuOpen(false);
    }
  }, []);

  // Close user menu on Escape key
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsUserMenuOpen(false);
    }
  }, []);

  // Add/remove event listeners for click outside and escape key
  useEffect(() => {
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isUserMenuOpen, handleClickOutside, handleEscapeKey]);

  useEffect(() => {
    const supabase = createBrowserClient();

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const isAuthenticated = !!user;

  // Briefings group - Ask and Explore are related features
  const briefingsLinks = [
    { href: "/ask", label: "Ask" },
    { href: "/explore", label: "Explore" },
  ];

  // Other navigation items
  const otherLinks = [
    { href: "/accountability", label: "Investigations" },
    { href: "/about", label: "About" },
  ];

  // Combined for mobile
  const navLinks = [...briefingsLinks, ...otherLinks];

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "bg-ivory-100/95 backdrop-blur-md",
        "border-b border-ivory-600",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-md"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-ivory-100" />
            </div>
            <span className="text-xl font-heading font-semibold text-ink-800">
              State of Clarity
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            {/* Briefings Group - subtle background to show grouping */}
            <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-sage-50 border border-sage-100">
              {briefingsLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-ui font-medium px-3 py-1.5 rounded-md",
                    "hover:bg-sage-100 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500",
                    pathname === link.href || pathname?.startsWith(link.href + "/")
                      ? "text-sage-700 bg-sage-100"
                      : "text-ink-600 hover:text-ink-800"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-ivory-600" />

            {/* Other nav items */}
            {otherLinks.map((link, index) => (
              <div key={link.href} className="flex items-center gap-3">
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm font-ui font-medium px-3 py-1.5 rounded-md",
                    "hover:bg-ivory-300 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                    pathname === link.href || pathname?.startsWith(link.href + "/")
                      ? "text-sage-600"
                      : "text-ink-600 hover:text-ink-800"
                  )}
                >
                  {link.label}
                </Link>
                {/* Separator after Investigations, before About */}
                {index === 0 && <div className="w-px h-6 bg-ivory-600" />}
              </div>
            ))}

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef} data-testid="user-menu-container">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md",
                    "text-sm font-ui font-medium text-ink-600",
                    "hover:bg-ivory-300 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  )}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  data-testid="user-menu-button"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sage-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-sage-600" />
                    </div>
                  )}
                  <span className="hidden sm:inline">
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "Account"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isUserMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div
                    className={cn(
                      "absolute right-0 mt-2 w-48 z-50",
                      "bg-ivory-100 rounded-lg shadow-lg",
                      "border border-ivory-600",
                      "py-1"
                    )}
                    role="menu"
                    data-testid="user-menu-dropdown"
                  >
                    <Link
                      href="/profile"
                      className={cn(
                        "block px-4 py-2 text-sm font-ui text-ink-600",
                        "hover:bg-ivory-300 transition-colors duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500"
                      )}
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className={cn(
                        "block px-4 py-2 text-sm font-ui text-ink-600",
                        "hover:bg-ivory-300 transition-colors duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500"
                      )}
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <div className="border-t border-ivory-600 my-1" />
                    <button
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm font-ui text-ink-600",
                        "hover:bg-ivory-300 transition-colors duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500"
                      )}
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className={cn(
                    "text-sm font-ui font-medium text-ink-600",
                    "hover:text-ink-800 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className={cn(
                    "px-4 py-2 rounded-md",
                    "bg-sage-500 text-ivory-100 font-ui font-medium text-sm",
                    "hover:bg-sage-600 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  )}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "md:hidden p-2 rounded-md",
              "text-ink-600 hover:bg-ivory-300 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
            )}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-out */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-40 transition-opacity duration-300 overflow-hidden",
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none invisible"
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-ink-800/20"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Slide-out Panel */}
        <nav
          className={cn(
            "absolute top-16 right-0 w-64 max-w-[80vw] h-[calc(100vh-4rem)]",
            "bg-ivory-100 border-l border-ivory-600",
            "transform transition-transform duration-300 ease-in-out",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          aria-label="Mobile navigation"
        >
          <div className="p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-3 rounded-md min-h-[48px] flex items-center",
                  "text-base font-ui font-medium",
                  "hover:bg-ivory-300 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
                  pathname === link.href || pathname?.startsWith(link.href + "/")
                    ? "text-sage-600 bg-sage-50"
                    : "text-ink-600"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-ivory-600 my-4" />

            {isAuthenticated && user ? (
            <>
              <Link
                href="/profile"
                className={cn(
                  "block px-4 py-3 rounded-md min-h-[48px] flex items-center gap-3",
                  "text-base font-ui font-medium text-ink-600",
                  "hover:bg-ivory-300 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-sage-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-sage-600" />
                  </div>
                )}
                Profile
              </Link>
              <Link
                href="/settings"
                className={cn(
                  "block px-4 py-3 rounded-md min-h-[48px] flex items-center",
                  "text-base font-ui font-medium text-ink-600",
                  "hover:bg-ivory-300 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                className={cn(
                  "w-full text-left px-4 py-3 rounded-md min-h-[48px] flex items-center",
                  "text-base font-ui font-medium text-ink-600",
                  "hover:bg-ivory-300 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                )}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className={cn(
                    "block px-4 py-3 rounded-md min-h-[48px] flex items-center",
                    "text-base font-ui font-medium text-ink-600",
                    "hover:bg-ivory-300 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className={cn(
                    "block px-4 py-3 rounded-md min-h-[48px] flex items-center justify-center",
                    "bg-sage-500 text-ivory-100 font-ui font-medium text-base",
                    "hover:bg-sage-600 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
