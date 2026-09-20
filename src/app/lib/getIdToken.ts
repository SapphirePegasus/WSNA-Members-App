"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Acquires the current user's ID token silently.
// Thin re-export kept for API stability - hooks that call protected routes
// import from here. All MSAL state lives in authClient; this module must
// never construct its own PublicClientApplication.
// Returns null if no account is found or silent acquisition fails -
// callers treat null as an unauthenticated state and do not proceed.
// ─────────────────────────────────────────────────────────────────────────────

export { acquireIdToken as getIdToken } from "@/app/lib/authClient";
