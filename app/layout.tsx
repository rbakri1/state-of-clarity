import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "State of Clarity | See politics clearly. Decide wisely.",
  description:
    "An AI-powered policy brief generator that delivers transparent, multi-layered answers to any political question.",
  openGraph: {
    title: "State of Clarity",
    description: "See politics clearly. Decide wisely.",
    type: "website",
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
        <OfflineBanner />
        <Header />
        <ErrorBoundary>
          <main className="flex-1">{children}</main>
        </ErrorBoundary>
        <Footer />
      </body>
    </html>
  );
}
