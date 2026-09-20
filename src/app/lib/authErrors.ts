"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Auth error mapping - single place that translates raw errors (MSAL popup
// errors, fetch/network failures, rate-limit responses) into typed,
// user-friendly messages.
//
// Rules:
//   - Raw error detail is for the console (developers). Users only ever see
//     the friendly message - never error codes, stack traces, or internals.
//   - A `null` return means "stay silent": the user cancelled on purpose,
//     and nagging them with a toast would be worse UX than saying nothing.
// ─────────────────────────────────────────────────────────────────────────────

export type AuthErrorKind =
    | "popup-blocked"
    | "timeout"
    | "network"
    | "rate-limited"
    | "in-progress"
    | "unknown";

export interface AuthUiError {
    kind: AuthErrorKind;
    message: string;
    // Present only for rate-limited errors - seconds until retry is allowed.
    retryAfterSec?: number;
}

// MSAL surfaces errors with a string errorCode property (BrowserAuthError).
function getMsalErrorCode(err: unknown): string | null {
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
            // The user closed the popup themselves - intentional, stay silent.
            return null;

        case "popup_window_error":
        case "empty_window_error":
            return {
                kind: "popup-blocked",
                message:
                    "Your browser blocked the sign-in window. " +
                    "Please allow popups for this site and try again.",
            };

        case "monitor_window_timeout":
            return {
                kind: "timeout",
                message: "Sign-in timed out. Please try again.",
            };

        case "timed_out":
            return {
                kind: "timeout",
                message: "Sign-in timed out. Please try again.",
            };

        case "interaction_in_progress":
            return {
                kind: "in-progress",
                message:
                    "A sign-in window is already open. " +
                    "Finish or close it, then try again.",
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