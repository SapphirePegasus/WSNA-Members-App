"use client";

import React, { useEffect, useState } from "react";
import type { AuthUiError } from "@/app/lib/authErrors";

// ─────────────────────────────────────────────────────────────────────────────
// AuthToast - small, dependency-free error toast for the sign-in screen.
//
//   - role="alert" so screen readers announce it immediately
//   - auto-dismisses informational errors after 8s
//   - timeout / rate-limited errors persist until acted on (the user needs
//     to actually read and retry those)
//   - rate-limited errors disable Retry until the server's window elapses
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 8000;
const PERSISTENT_KINDS = new Set(["timeout", "rate-limited"]);

interface AuthToastProps {
    error: AuthUiError | null;
    onRetry: () => void;
    onDismiss: () => void;
}

export default function AuthToast({
    error,
    onRetry,
    onDismiss,
}: AuthToastProps) {
    const [cooldown, setCooldown] = useState(0);

    // Start the rate-limit countdown whenever a new error arrives.
    useEffect(() => {
        setCooldown(error?.retryAfterSec ?? 0);
    }, [error]);

    // Tick the countdown once per second while active.
    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setInterval(
            () => setCooldown((s) => (s > 0 ? s - 1 : 0)),
            1_000
        );
        return () => clearInterval(id);
    }, [cooldown]);

    // Auto-dismiss non-critical errors.
    useEffect(() => {
        if (!error || PERSISTENT_KINDS.has(error.kind)) return;
        const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
        return () => clearTimeout(id);
    }, [error, onDismiss]);

    if (!error) return null;

    const retryDisabled = cooldown > 0;

    return (
        <div
            role="alert"
            className="
                fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]
                w-[calc(100%-2rem)] max-w-md
                flex items-start gap-3
                rounded-lg bg-[#0a2a4a] text-white
                px-4 py-3 shadow-lg
            "
        >
            <p className="flex-1 text-sm leading-snug">
                {error.message}
                {retryDisabled && (
                    <span className="block mt-1 text-xs opacity-80">
                        Retry available in {cooldown}s
                    </span>
                )}
            </p>

            <button
                type="button"
                onClick={onRetry}
                disabled={retryDisabled}
                className="
                    shrink-0 text-sm font-semibold underline underline-offset-2
                    hover:opacity-80 transition
                    disabled:opacity-40 disabled:cursor-not-allowed
                "
            >
                Retry
            </button>

            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss"
                className="shrink-0 text-lg leading-none opacity-70 hover:opacity-100 transition"
            >
                &times;
            </button>
        </div>
    );
}