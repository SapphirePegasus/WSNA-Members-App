"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { resumeSession } from "@/app/lib/authClient";
import { consumeRedirectTarget } from "@/app/lib/authRedirect";
import { AUTH_REDIRECT_ERROR_KEY, getMsalErrorCode } from "@/app/lib/authErrors";

// ─────────────────────────────────────────────────────────────────────────────
// RedirectPage - the landing page for both the login and logout round trips
// (see msalConfig.ts: redirectUri / postLogoutRedirectUri both point here).
//
// On arrival:
//   - A session was just established -> forward to the deep link captured
//     by AuthGuard/PrivateShell before the redirect started, or /home.
//   - No session (logout return, or a direct/stale hit on this URL) ->
//     back to the login page.
//   - The identity provider reported a real error for a flow we initiated
//     -> stash the error code for UserInfo.tsx to surface as a toast, then
//     back to the login page.
//
// navigateToLoginRequestUrl is disabled in msalConfig.ts specifically so
// MSAL never navigates on our behalf here - this page is the only place
// that decides where the user goes next.
// ─────────────────────────────────────────────────────────────────────────────
export default function RedirectPage() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        async function resume() {
            try {
                const { session } = await resumeSession();
                if (cancelled) return;

                if (session) {
                    router.replace(consumeRedirectTarget() ?? "/home");
                } else {
                    consumeRedirectTarget(); // drop any stale deep link
                    router.replace("/");
                }
            } catch (err) {
                if (cancelled) return;

                console.error("[RedirectPage] Failed to resume session:", err);
                try {
                    sessionStorage.setItem(
                        AUTH_REDIRECT_ERROR_KEY,
                        getMsalErrorCode(err) ?? "unknown"
                    );
                } catch {
                    // Non-fatal - user just won't see a specific error toast.
                }

                consumeRedirectTarget();
                router.replace("/");
            }
        }

        void resume();

        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "100vw",
                backgroundColor: "#ffffff",
                gap: "16px",
            }}
        >
            <div
                style={{
                    width: "36px",
                    height: "36px",
                    border: "4px solid #e5e7eb",
                    borderTopColor: "#0057b8",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                }}
            />
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <p
                style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: 0,
                }}
            >
                Please Wait...
            </p>
        </div>
    );
}