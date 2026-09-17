import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import ServiceWorkerRegistration from "./components/global/ServiceWorkerRegistration";

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
  metadataBase: new URL("https://my.wsna.org"),
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "My WSNA",
    startupImage: [
      {
        url: "/icons/apple-touch-icon.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://my.wsna.org",
    siteName: "My WSNA",
    title: "My WSNA | Member Portal",
    description:
      "The official member portal for Washington State Nurses Association.",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "My WSNA Member Portal",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "My WSNA | Member Portal",
    description:
      "The official member portal for Washington State Nurses Association.",
    images: ["/icons/icon-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/favicon-32x32.png",
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
      <head>
        {/* Apple PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="My WSNA" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="My WSNA" />

        {/* Microsoft tile */}
        <meta name="msapplication-TileColor" content="#0057b8" />
        <meta name="msapplication-TileImage" content="/icons/icon-192x192.png" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* iOS Splash Screens */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
          href="/icons/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
          href="/icons/apple-touch-icon.png"
        />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
