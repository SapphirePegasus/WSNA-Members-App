import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://login.microsoftonline.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self'
    https://login.microsoftonline.com
    https://login.microsoft.com
    https://graph.microsoft.com
    https://*.dynamics.com
    https://*.crm.dynamics.com;
  frame-src 'self' https://login.microsoftonline.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
  worker-src 'self';
  manifest-src 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

// Service worker specific headers
// sw.js must not be cached by the browser HTTP cache
// The SW runtime handles its own caching lifecycle
const serviceWorkerHeaders = [
  {
    key: "Cache-Control",
    value: "no-cache, no-store, must-revalidate",
  },
  {
    key: "Service-Worker-Allowed",
    value: "/",
  },
];

const BUILD_TIMESTAMP = Date.now().toString();

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      // Service worker — must never be HTTP cached
      {
        source: "/sw.js",
        headers: [
          ...serviceWorkerHeaders,
          {
            key: "X-Build-Timestamp",
            value: BUILD_TIMESTAMP,
          },
        ],
      },
      // All other routes get security headers
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;