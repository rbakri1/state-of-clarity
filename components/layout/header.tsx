"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // TODO: Replace with actual auth state from Supabase
  const isAuthenticated = false;
  const user = null as { name?: string; email?: string; avatar_url?: string } | null;

  const navLinks = [
    { href: "/ask", label: "Ask Anything" },
    { href: "/about", label: "About" },
  ];

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
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-ui font-medium text-ink-600",
                  "hover:text-ink-800 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-md px-1"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <div className="relative">
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
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sage-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-sage-600" />
                    </div>
                  )}
                  <span className="hidden sm:inline">
                    {user.name || user.email?.split("@")[0] || "Account"}
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
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div
                      className={cn(
                        "absolute right-0 mt-2 w-48 z-50",
                        "bg-ivory-100 rounded-lg shadow-lg",
                        "border border-ivory-600",
                        "py-1"
                      )}
                      role="menu"
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
                        onClick={() => {
                          // TODO: Implement sign out
                          setIsUserMenuOpen(false);
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
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
                  "text-base font-ui font-medium text-ink-600",
                  "hover:bg-ivory-300 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
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
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
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
                  onClick={() => {
                    // TODO: Implement sign out
                    setIsMobileMenuOpen(false);
                  }}
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
