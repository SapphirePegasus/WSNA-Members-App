"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Deep-link preservation across the sign-in bounce.
//
// When a signed-out user hits a protected URL like /membership?tab=resources,
// AuthGuard redirects them to the login screen ("/"). We stash the URL they
// were actually trying to reach here, and UserProvider restores it after a
// successful interactive login - so they land back where they intended,
// query string (?tab=...) included, instead of always on /home.
//
// Single source of truth for the key name - imported by both the writer
// (AuthGuard) and the reader (UserProvider) so they can never drift.
// ─────────────────────────────────────────────────────────────────────────────

export const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

// Paths that must never be stored as a post-login destination: the login
// screen itself, the default landing page, and the terminal not-a-member
// screen. Storing any of these would either loop or override the sensible
// default.
const NON_RESTORABLE_PATHS = new Set(["/", "/home", "/not-a-member"]);

// Captures the current location (path + query) as the post-login target,
// unless it is a non-restorable path. Safe to call in any browser state -
// sessionStorage failures (private mode) are swallowed and simply mean the
// user falls back to /home after login.
export function captureRedirectTarget(pathname: string, search: string): void {
    if (NON_RESTORABLE_PATHS.has(pathname)) return;

    const target = `${pathname}${search}`;
    try {
        sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, target);
    } catch {
        // Non-fatal - login will default to /home.
    }
}

// Reads and clears the stored post-login target. Returns null if nothing
// was stored or the stored value fails validation. Validation is defence
// in depth: only same-app absolute paths ("/x", never "//host" or a full
// URL) are ever returned, so a corrupted or tampered value can never turn
// the post-login redirect into an open redirect.
export function consumeRedirectTarget(): string | null {
    try {
        const target = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
        sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);

        if (!target) return null;
        if (!target.startsWith("/") || target.startsWith("//")) return null;

        return target;
    } catch {
        return null;
    }
}