"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Auth error mapping - single place that translates raw errors (MSAL
// redirect-flow errors, fetch/network failures, rate-limit responses) into
// typed, user-friendly messages.
//
// Rules:
//   - Raw error detail is for the console (developers). Users only ever see
//     the friendly message - never error codes, stack traces, or internals.
//   - A `null` return means "stay silent": the user backed out on purpose
//     (e.g. declined on the identity provider's page), and nagging them
//     with a toast would be worse UX than saying nothing.
// ─────────────────────────────────────────────────────────────────────────────

export type AuthErrorKind =
    | "timeout"
    | "network"
    | "rate-limited"
    | "in-progress"
    | "redirect-failed"
    | "unknown";

export interface AuthUiError {
    kind: AuthErrorKind;
    message: string;
    // Present only for rate-limited errors - seconds until retry is allowed.
    retryAfterSec?: number;
}

// sessionStorage key redirect/page.tsx writes to when the identity provider
// (or our own redirect-handling code) reports a real failure for a flow we
// initiated. UserInfo.tsx reads and clears it once on mount - the page that
// receives the error (the login page) is a different mount than the one
// that caught it (/redirect), so sessionStorage is the handoff.
export const AUTH_REDIRECT_ERROR_KEY = "wsna.auth.redirectErrorCode";

// MSAL surfaces errors with a string errorCode property (BrowserAuthError /
// ServerError). Exported so redirect/page.tsx can extract the same code it
// stashes for UserInfo.tsx to map, without duplicating this logic.
export function getMsalErrorCode(err: unknown): string | null {
    if (typeof err === "object" && err !== null && "errorCode" in err) {
        const code = (err as { errorCode: unknown }).errorCode;
        return typeof code === "string" ? code : null;
    }
    return null;
}

function isAbortOrTimeout(err: unknown): boolean {
    // AbortSignal.timeout() rejects fetch with a DOMException named
    // "TimeoutError"; manual aborts use "AbortError". Treat both as timeout.
    return (
        err instanceof DOMException &&
        (err.name === "TimeoutError" || err.name === "AbortError")
    );
}

// Returns a user-facing error, or null when the failure should be silent.
export function mapAuthError(err: unknown): AuthUiError | null {
    const code = getMsalErrorCode(err);

    switch (code) {
        case "user_cancelled":
        case "access_denied":
            // The user backed out or declined on the identity provider's
            // page - intentional, stay silent.
            return null;

        // MSAL still uses a hidden iframe for silent token renewal
        // (acquireTokenSilent) regardless of the interactive method, so
        // these can still occur even though interactive sign-in no longer
        // uses a popup or monitored window.
        case "monitor_window_timeout":
        case "timed_out":
            return {
                kind: "timeout",
                message: "Sign-in timed out. Please try again.",
            };

        case "interaction_in_progress":
            return {
                kind: "in-progress",
                message:
                    "A sign-in is already in progress. Please wait a moment, or refresh the page and try again.",
            };

        // The temporary request state MSAL writes to sessionStorage before
        // navigating to the identity provider (nonce, PKCE verifier,
        // request state) couldn't be found or didn't match on return. Most
        // commonly caused by the browser clearing storage mid-sign-in, or
        // completing the round trip in a different tab.
        case "no_token_request_cache_error":
        case "state_mismatch":
        case "nonce_mismatch":
        case "no_cached_authority_error":
            return {
                kind: "redirect-failed",
                message:
                    "We couldn't complete your sign-in. Please try again without switching tabs or apps during the process.",
            };

        default:
            break;
    }

    if (isAbortOrTimeout(err)) {
        return {
            kind: "timeout",
            message:
                "Verifying your membership took too long. " +
                "Check your connection and try again.",
        };
    }

    if (err instanceof TypeError) {
        // fetch() rejects with TypeError on network failure (offline, DNS).
        return {
            kind: "network",
            message:
                "We couldn't reach the server. " +
                "Check your connection and try again.",
        };
    }

    return {
        kind: "unknown",
        message: "Something went wrong during sign-in. Please try again.",
    };
}

// Builds the rate-limited error from the server's 429 response headers.
export function rateLimitedError(retryAfterHeader: string | null): AuthUiError {
    const parsed = Number(retryAfterHeader);
    const retryAfterSec =
        Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 30;

    return {
        kind: "rate-limited",
        message: "Too many attempts. Please wait a moment and try again.",
        retryAfterSec,
    };
}