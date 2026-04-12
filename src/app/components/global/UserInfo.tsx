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
    | "initializing"  // MSAL not yet ready
    | "signed-out"    // no account in MSAL
    | "loading"       // account found, Dataverse check in progress
    | "registered"    // account found + exists in Dataverse contacts
    | "not-registered"; // account found + does NOT exist in Dataverse contacts

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

// ── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { instance, accounts } = useMsal();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [contact, setContact] = useState<ContactRecord | null>(null);
    const [status, setStatus] = useState<AuthStatus>("initializing");

    // ── Dataverse membership check ─────────────────────────────────────────────

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
            // Silently acquire the ID token — no popup, uses cached token
            const tokenResponse = await instance.acquireTokenSilent({
                ...loginRequest,
                account,
            });

            const idToken = tokenResponse.idToken;

            if (!idToken) {
                throw new Error("No ID token returned from acquireTokenSilent");
            }

            // Send verified token to API — email is extracted server-side from claims
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
            });

            /*if (res.status === 401) {
                // Token was rejected server-side — treat as signed out
                await instance.logoutPopup({ account });
                setUser(null);
                setContact(null);
                setStatus("signed-out");
                return;
            }*/

            if (res.status === 401) {
                // Token was rejected server-side — clear state only, no logoutPopup
                // logoutPopup here would open a second unwanted popup
                setUser(null);
                setContact(null);
                setStatus("signed-out");
                return;
            }

            if (!res.ok) {
                throw new Error(`Unexpected response from /api/contact: ${res.status}`);
            }

            const data = await res.json();

            if (data.found) {
                setContact(data.contact as ContactRecord);
                setStatus("registered");

                // Redirect to stored path or fallback to /membership
                const redirectTo =
                    sessionStorage.getItem("redirectAfterLogin") ?? "/membership";
                sessionStorage.removeItem("redirectAfterLogin");
                router.replace(redirectTo);
            } else {
                // Valid MS account but not in Dataverse — reject and clean up
                // Use logoutRedirect with no popup to silently clear the MSAL session
                setContact(null);
                setStatus("not-registered");
                await instance.clearCache();
                router.replace("/");
            }
        } catch (err) {
            console.error("[UserProvider] Membership check failed:", err);
            setUser(null);
            setContact(null);
            setStatus("signed-out");
        }
    }, [accounts, instance, router]);

    // ── Watch for MSAL account changes ────────────────────────────────────────

    useEffect(() => {
        checkMembership();
    }, [checkMembership]);

    // ── Login ──────────────────────────────────────────────────────────────────

    const login = useCallback(async () => {
        try {
            await instance.loginPopup(loginRequest);
            // accounts[] will update automatically via useMsal
            // useEffect above will fire checkMembership
        } catch (err) {
            console.error("[UserProvider] Login failed:", err);
        }
    }, [instance]);

    // ── Logout ─────────────────────────────────────────────────────────────────

    const logout = useCallback(async () => {
        try {
            const account = accounts[0];
            if (account) {
                await instance.logoutPopup({ account });
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

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useUser(): UserContextType {
    const ctx = useContext(UserContext);
    if (!ctx) {
        throw new Error("useUser must be used inside UserProvider");
    }
    return ctx;
}
