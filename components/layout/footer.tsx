"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ];

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/ask", label: "Ask Anything" },
  ];

  return (
    <footer
      className={cn(
        "bg-ivory-300 border-t border-ivory-600",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-md"
              )}
            >
              <div className="w-6 h-6 rounded-lg bg-sage-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-ivory-100" />
              </div>
              <span className="text-lg font-heading font-semibold text-ink-800">
                State of Clarity
              </span>
            </Link>
            <p className="text-sm font-ui text-ink-500 max-w-xs">
              AI-powered policy briefs that help you see politics clearly and decide wisely.
            </p>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Footer navigation" className="space-y-4">
            <h3 className="text-sm font-ui font-semibold text-ink-600 uppercase tracking-wide">
              Navigate
            </h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "text-sm font-ui text-ink-500",
                      "hover:text-ink-800 transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-md"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal Links */}
          <nav aria-label="Legal" className="space-y-4">
            <h3 className="text-sm font-ui font-semibold text-ink-600 uppercase tracking-wide">
              Legal
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "text-sm font-ui text-ink-500",
                      "hover:text-ink-800 transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-md"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-ivory-600 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-sm font-ui text-ink-500">
              © {currentYear} State of Clarity. All rights reserved.
            </p>

            {/* Social Links (placeholder for future) */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-ui text-ink-400">
                Evidence-based. Non-partisan.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
