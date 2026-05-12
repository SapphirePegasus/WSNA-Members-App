// CHANGE THE URL IN THIS CODE AND ALSO IN ROBOTS.TS

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

// ── Viewport ──────────────────────────────────────────────────────────────────
// Must be a separate named export from metadata — Next.js App Router requires
// this split. Mixing viewport config into metadata is unsupported and silently
// ignored in Next.js 13.4+.
//
// viewport-fit=cover is required to unlock env(safe-area-inset-*) CSS
// variables on iOS. Without it, safe-area-inset-bottom always returns 0,
// making gesture navigation fixes ineffective.
//
// themeColor uses media queries to respect the user's dark/light preference.
// Two entries are required — one per color scheme. The browser applies the
// matching one automatically.
//
// userScalable=false prevents iOS Safari's double-tap zoom which breaks
// the native-app feel in standalone PWA mode.
// ─────────────────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0057b8" },
    { media: "(prefers-color-scheme: dark)", color: "#0057b8" },
  ],
};

// ── SEO Metadata ─────────────────────────────────────────────────────────────
// This applies to the home page by default.
// Each individual page can override any of these values
// by exporting its own `metadata` object - as seen in membership and growth pages.

export const metadata: Metadata = {
  metadataBase: new URL("https://wsna.org"),
  title: {
    default: "My WSNA | Member Portal",
    template: "%s | WSNA",
  },
  description:
    "The official member portal for Washington State Nurses Association. Access your membership card, benefits, and professional growth resources.",
  keywords: [
    "WSNA",
    "Washington State Nurses Association",
    "nurse membership",
    "nursing union",
    "members portal",
    "member portal",
    "members app",
    "member app",
  ],
  authors: [
    { name: "Washington State Nurses Association", url: "https://www.wsna.org/" },
    { name: "Unisym Tech", url: "https://www.unisymtech.com/" },
    { name: "Prittam Bhattacharyya", url: "https://www.sapphirepegasus.com" },
  ],
  creator: "Washington State Nurses Association",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wsna.org",
    siteName: "My WSNA",
    title: "My WSNA | Member Portal",
    description:
      "The official member portal for Washington State Nurses Association.",
  },
  twitter: {
    card: "summary",
    title: "My WSNA | Member Portal",
    description:
      "The official member portal for Washington State Nurses Association.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}