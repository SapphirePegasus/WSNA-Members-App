"use client";

import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "@/app/lib/msalConfig";

// ─────────────────────────────────────────────────────────────────────────────
// Acquires the current user's ID token silently from MSAL.
// Used by client-side hooks that call protected API routes.
// Returns null if no account is found or silent acquisition fails -
// callers should treat null as an unauthenticated state and not proceed.
// ─────────────────────────────────────────────────────────────────────────────
export async function getIdToken(): Promise<string | null> {
    try {
        // Reuse the singleton instance - do not create a new one
        const instance = new PublicClientApplication(msalConfig);
        await instance.initialize();

        const accounts = instance.getAllAccounts();
        if (!accounts.length) return null;

        const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
        });

        return response.idToken ?? null;
    } catch {
        return null;
    }
}