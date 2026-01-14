import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";
import { PostHogProvider } from "./components/PostHogProvider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WelcomeModalWrapper } from "@/components/onboarding/welcome-modal-wrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stateofclarity.org";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "State of Clarity | See politics clearly. Decide wisely.",
  description:
    "An AI-powered policy brief generator that delivers transparent, multi-layered answers to any political question.",
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
    apple: "/brand/favicon.svg",
  },
  openGraph: {
    title: "State of Clarity",
    description: "See politics clearly. Decide wisely.",
    url: baseUrl,
    siteName: "State of Clarity",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "State of Clarity - See politics clearly. Decide wisely.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "State of Clarity",
    description: "See politics clearly. Decide wisely.",
    images: ["/api/og"],
    creator: "@stateofclarity",
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-ivory-100 text-ink-800 min-h-screen flex flex-col">
        <PostHogProvider>
          <OfflineBanner />
          <Header />
          <ErrorBoundary>
            <main className="flex-1">{children}</main>
          </ErrorBoundary>
          <Footer />
          <WelcomeModalWrapper />
        </PostHogProvider>
      </body>
    </html>
  );
}
