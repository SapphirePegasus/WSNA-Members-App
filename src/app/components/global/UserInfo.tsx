"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";
import { useRouter } from "next/navigation";
import { consumeRedirectTarget } from "@/app/lib/authRedirect";
import {
    getActiveSession,
    login as authLogin,
    logout as authLogout,
    clearSession,
    acquireIdToken,
    type AuthSource,
} from "@/app/lib/authClient";
import {
    mapAuthError,
    rateLimitedError,
    type AuthUiError,
} from "@/app/lib/authErrors";
import type { ContactRecord } from "@/app/dataverse/contactRepository";

// ── Types ────────────────────────────────────────────────────────────────────

export type AuthStatus =
    | "initializing"    // auth clients not yet probed
    | "signed-out"      // no account in either MSAL client
    | "loading"         // account found, Dataverse check in progress
    | "registered"      // account found + classified as member or non-member
    | "not-registered"  // account found + no contact row in Dataverse
    | "unrecognized";   // account found + contact exists but membertype/status
// does not match any recognised category

export interface User {
    name: string;
    email: string;
}

interface UserContextType {
    user: User | null;
    contact: ContactRecord | null;
    status: AuthStatus;
    // source defaults to "workforce" - the existing sign-in button behaviour.
    // Pass "external" only from the email one-time-passcode link.
    login: (source?: AuthSource) => Promise<void>;
    logout: () => Promise<void>;
    // User-facing auth error for the toast. Raw detail stays in the console.
    authError: AuthUiError | null;
    clearAuthError: () => void;
    // Graceful retry: re-runs the membership check if a session already
    // exists (no second popup), otherwise re-opens sign-in with the same
    // source (workforce/external) the user last attempted.
    retry: () => Promise<void>;
}

// ── Session storage key ───────────────────────────────────────────────────────
// Single source of truth for the key name — consumed here and in
// /not-a-member page. Never put a reason in the URL.
const NOT_A_MEMBER_REASON_KEY = "notAMemberReason";

// ── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [contact, setContact] = useState<ContactRecord | null>(null);
    const [status, setStatus] = useState<AuthStatus>("initializing");
    const [authError, setAuthError] = useState<AuthUiError | null>(null);
    const lastSourceRef = useRef<AuthSource>("workforce");
    // True only for the window between an interactive login() call and the
    // membership check it triggers. Session-restore on mount / reload leaves
    // this false, so a reload never navigates away from the current URL.
    const interactiveLoginRef = useRef(false);

    const clearAuthError = useCallback(() => setAuthError(null), []);

    // ── Dataverse membership check ────────────────────────────────────────────

    const checkMembership = useCallback(async () => {
        const session = await getActiveSession();

        if (!session) {
            setUser(null);
            setContact(null);
            setStatus("signed-out");
            return;
        }

        setStatus("loading");
        setUser({
            name: session.account.name ?? "",
            email: session.account.username ?? "",
        });

        try {
            const idToken = await acquireIdToken();

            if (!idToken) {
                throw new Error("No ID token returned from silent acquisition");
            }

            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                // Never hang a spinner forever - a stalled request surfaces
                // as a timeout toast instead of an infinite "loading" state.
                signal: AbortSignal.timeout(15_000),
            });

            if (res.status === 401) {
                setUser(null);
                setContact(null);
                setStatus("signed-out");
                return;
            }

            if (res.status === 429) {
                // Our own rate limiter. The MSAL session is intact, so the
                // toast's Retry re-runs this check without a new popup.
                setAuthError(rateLimitedError(res.headers.get("Retry-After")));
                setStatus("signed-out");
                return;
            }

            if (!res.ok) {
                throw new Error(
                    `Unexpected response from /api/contact: ${res.status}`
                );
            }

            const data = await res.json();

            if (data.found) {
                // ── Registered: member or non-member ─────────────────────────
                setContact(data.contact as ContactRecord);
                setStatus("registered");

                // Navigation policy:
                //   - Fresh interactive login  -> stored deep link, else /home.
                //   - Authenticated but sitting on the login page ("/"), e.g.
                //     after a reload there or a retry recovery -> forward the
                //     same way; the login page is never a destination.
                //   - Plain reload anywhere else -> stay put. The current URL,
                //     including any ?tab= deep link, is already correct.
                // consumeRedirectTarget() validates the stored value (same-app
                // absolute paths only) and clears it in one step.
                const isOnLoginPage = window.location.pathname === "/";
                if (interactiveLoginRef.current || isOnLoginPage) {
                    interactiveLoginRef.current = false;
                    router.replace(consumeRedirectTarget() ?? "/home");
                }
                return;
            }

            // ── Contact not found or unrecognized ─────────────────────────────
            // Write the reason before MSAL cleanup and status update so that
            // by the time AuthGuard reacts to the new status and redirects,
            // the reason is already in sessionStorage for the target page.
            const reason: "not-registered" | "unrecognized" =
                data.reason === "unrecognized" ? "unrecognized" : "not-registered";

            sessionStorage.setItem(NOT_A_MEMBER_REASON_KEY, reason);

            // This login attempt is terminating at /not-a-member, so drop any
            // captured deep link and clear the interactive flag - neither
            // should survive into a later session.
            interactiveLoginRef.current = false;
            consumeRedirectTarget();

            setUser(null);
            setContact(null);

            await clearSession();

            setStatus(reason);
            router.replace("/not-a-member");

        } catch (err) {
            console.error("[UserProvider] Membership check failed:", err);
            const mapped = mapAuthError(err);
            if (mapped) setAuthError(mapped);
            setUser(null);
            setContact(null);
            setStatus("signed-out");
        }
    }, [router]);

    // ── Restore any existing session on mount ─────────────────────────────────

    useEffect(() => {
        void checkMembership();
    }, [checkMembership]);

    // ── Login ──────────────────────────────────────────────────────────────────

    const login = useCallback(
        async (source: AuthSource = "workforce") => {
            setAuthError(null);
            lastSourceRef.current = source;
            interactiveLoginRef.current = true;
            try {
                await authLogin(source);
            } catch (err: unknown) {
                console.error("[UserProvider] Login failed:", err);
                const mapped = mapAuthError(err);
                if (mapped) setAuthError(mapped);
                throw err;
            }
            // Popup resolved with a signed-in account - run the membership
            // check explicitly (no msal-react accounts subscription anymore).
            await checkMembership();
        },
        [checkMembership]
    );

    // ── Retry ──────────────────────────────────────────────────────────────────

    const retry = useCallback(async () => {
        setAuthError(null);
        const session = await getActiveSession();
        if (session) {
            // Auth already succeeded; only the membership check failed.
            await checkMembership();
            return;
        }
        try {
            await login(lastSourceRef.current);
        } catch {
            // login() already mapped and surfaced the error.
        }
    }, [checkMembership, login]);

    // ── Logout ─────────────────────────────────────────────────────────────────

    const logout = useCallback(async () => {
        try {
            await authLogout();
        } catch (err) {
            console.error("[UserProvider] Logout failed:", err);
        } finally {
            setUser(null);
            setContact(null);
            setStatus("signed-out");
            router.replace("/");
        }
    }, [router]);

    // ── Context value ──────────────────────────────────────────────────────────

    const value: UserContextType = {
        user,
        contact,
        status,
        login,
        logout,
        authError,
        clearAuthError,
        retry,
    };

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useUser(): UserContextType {
    const ctx = useContext(UserContext);
    if (!ctx) {
        throw new Error("useUser must be used inside UserProvider");
    }
    return ctx;
}