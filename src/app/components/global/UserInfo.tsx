"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/app/lib/msalConfig";
import type { ContactRecord } from "@/app/dataverse/contactRepository";

// ── Types ────────────────────────────────────────────────────────────────────

export type AuthStatus =
    | "initializing"    // MSAL not yet ready
    | "signed-out"      // no account in MSAL
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
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

// ── Session storage key ───────────────────────────────────────────────────────
// Single source of truth for the key name — consumed here and in
// /not-a-member page. Never put a reason in the URL.
const NOT_A_MEMBER_REASON_KEY = "notAMemberReason";

// ── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { instance, accounts } = useMsal();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [contact, setContact] = useState<ContactRecord | null>(null);
    const [status, setStatus] = useState<AuthStatus>("initializing");

    // ── Shared MSAL cleanup ───────────────────────────────────────────────────
    // Extracted to avoid duplication between not-registered and unrecognized
    // paths. Both require the same MSAL teardown before status is set.
    const clearMsalSession = useCallback(async () => {
        await instance.clearCache();
        instance.setActiveAccount(null);
    }, [instance]);

    // ── Dataverse membership check ────────────────────────────────────────────

    const checkMembership = useCallback(async () => {
        const account = accounts[0];

        if (!account) {
            setUser(null);
            setContact(null);
            setStatus("signed-out");
            return;
        }

        setStatus("loading");
        setUser({
            name: account.name ?? "",
            email: account.username ?? "",
        });

        try {
            const tokenResponse = await instance.acquireTokenSilent({
                ...loginRequest,
                account,
            });

            const idToken = tokenResponse.idToken;

            if (!idToken) {
                throw new Error("No ID token returned from acquireTokenSilent");
            }

            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (res.status === 401) {
                setUser(null);
                setContact(null);
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

                const redirectTo =
                    sessionStorage.getItem("redirectAfterLogin") ?? "/home";
                sessionStorage.removeItem("redirectAfterLogin");
                router.replace(redirectTo);
                return;
            }

            // ── Contact not found or unrecognized ─────────────────────────────
            // Write the reason before MSAL cleanup and status update so that
            // by the time AuthGuard reacts to the new status and redirects,
            // the reason is already in sessionStorage for the target page.
            const reason: "not-registered" | "unrecognized" =
                data.reason === "unrecognized" ? "unrecognized" : "not-registered";

            sessionStorage.setItem(NOT_A_MEMBER_REASON_KEY, reason);

            setUser(null);
            setContact(null);

            await clearMsalSession();

            setStatus(reason);
            router.replace("/not-a-member");

        } catch (err) {
            console.error("[UserProvider] Membership check failed:", err);
            setUser(null);
            setContact(null);
            setStatus("signed-out");
        }
    }, [accounts, instance, router, clearMsalSession]);

    // ── Watch for MSAL account changes ────────────────────────────────────────

    useEffect(() => {
        checkMembership();
    }, [checkMembership]);

    // ── Login ──────────────────────────────────────────────────────────────────

    const login = useCallback(async () => {
        try {
            instance.clearCache();
            await instance.loginPopup(loginRequest);
        } catch (err: any) {
            if (
                err?.errorCode === "user_cancelled" ||
                err?.message?.includes("user_cancelled") ||
                err?.name === "BrowserAuthError"
            ) {
                throw err;
            }
            console.error("[UserProvider] Login failed:", err);
            throw err;
        }
    }, [instance]);

    // ── Logout ─────────────────────────────────────────────────────────────────

    const logout = useCallback(async () => {
        try {
            const account = accounts[0];
            if (account) {
                await instance.logoutPopup({
                    account,
                    postLogoutRedirectUri: "/redirect",
                });
            }
        } catch (err) {
            console.error("[UserProvider] Logout failed:", err);
        } finally {
            setUser(null);
            setContact(null);
            setStatus("signed-out");
            router.replace("/");
        }
    }, [accounts, instance, router]);

    // ── Context value ──────────────────────────────────────────────────────────

    const value: UserContextType = {
        user,
        contact,
        status,
        login,
        logout,
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