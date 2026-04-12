import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/app/components/global/AppShell";

// ── SEO Metadata ─────────────────────────────────────────────────────────────
// This applies to the home page by default.
// Each individual page can override any of these values
// by exporting its own `metadata` object — as seen in membership and growth pages.

// CHANGE THE URL IN THIS CODE AND ALSO IN ROBOTS.TS

export const metadata: Metadata = {
  metadataBase: new URL("https://yourdomain.com"),
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
    "member portal",
    "member app",
  ],
  authors: [
    { name: "Washington State Nurses Association", url: "https://www.wsna.org/" },
    { name: "Prittam Bhattacharyya", url: "https://www.sapphirepegasus.com" },
  ],
  creator: "Washington State Nurses Association",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://yourdomain.com",
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}