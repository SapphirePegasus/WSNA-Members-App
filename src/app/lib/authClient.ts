"use client";

import {
    PublicClientApplication,
    type AccountInfo,
} from "@azure/msal-browser";
import {
    getWorkforceMsalConfig,
    getExternalMsalConfig,
    loginRequest,
} from "@/app/lib/msalConfig";

// ─────────────────────────────────────────────────────────────────────────────
// authClient - the single owner of MSAL state for the whole app.
//
// The app talks to two independent identity systems (workforce tenant via
// login.microsoftonline.com, external tenant via ciamlogin.com), and one
// PublicClientApplication is bound to exactly one clientId. So we hold two
// lazily-initialised singletons and remember which one the active session
// came from ("auth source") in sessionStorage - the same lifetime as MSAL's
// own sessionStorage token cache, so the two can never outlive each other.
//
// Every other module (UserProvider, getIdToken) goes through this file.
// Nothing else in the app may construct a PublicClientApplication.
// ─────────────────────────────────────────────────────────────────────────────

export type AuthSource = "workforce" | "external";

const AUTH_SOURCE_KEY = "wsna.auth.source";

const clients: Partial<Record<AuthSource, PublicClientApplication>> = {};
const initPromises: Partial<Record<AuthSource, Promise<void>>> = {};

async function getClient(source: AuthSource): Promise<PublicClientApplication> {
    if (!clients[source]) {
        const config =
            source === "workforce"
                ? getWorkforceMsalConfig()
                : getExternalMsalConfig();
        clients[source] = new PublicClientApplication(config);
    }
    if (!initPromises[source]) {
        initPromises[source] = clients[source]!.initialize();
    }
    await initPromises[source];
    return clients[source]!;
}

// ── Auth source persistence ──────────────────────────────────────────────────
// sessionStorage access is wrapped: it can throw in some private-browsing
// modes. Auth degrades to probing both clients rather than crashing.

function readStoredSource(): AuthSource | null {
    try {
        const value = sessionStorage.getItem(AUTH_SOURCE_KEY);
        return value === "workforce" || value === "external" ? value : null;
    } catch {
        return null;
    }
}

function writeStoredSource(source: AuthSource): void {
    try {
        sessionStorage.setItem(AUTH_SOURCE_KEY, source);
    } catch {
        // Non-fatal - getActiveSession falls back to probing both clients.
    }
}

function clearStoredSource(): void {
    try {
        sessionStorage.removeItem(AUTH_SOURCE_KEY);
    } catch {
        // Non-fatal.
    }
}

// ── Active session resolution ────────────────────────────────────────────────

export interface ActiveSession {
    source: AuthSource;
    account: AccountInfo;
    client: PublicClientApplication;
}

export async function getActiveSession(): Promise<ActiveSession | null> {
    const stored = readStoredSource();
    const probeOrder: AuthSource[] = stored
        ? [stored, stored === "workforce" ? "external" : "workforce"]
        : ["workforce", "external"];

    for (const source of probeOrder) {
        try {
            const client = await getClient(source);
            const accounts = client.getAllAccounts();
            if (accounts.length > 0) {
                writeStoredSource(source);
                return { source, account: accounts[0], client };
            }
        } catch (err) {
            // A misconfigured flow (e.g. missing EXTERNAL_* env) must not
            // take down the other one. Log and keep probing.
            console.error(`[authClient] ${source} client unavailable:`, err);
        }
    }

    clearStoredSource();
    return null;
}

// ── Login / logout / teardown ────────────────────────────────────────────────

export async function login(source: AuthSource): Promise<void> {
    const client = await getClient(source);
    // Match previous behaviour: clear any stale cached state on this client
    // before an interactive login so the account picker starts clean.
    await client.clearCache();
    await client.loginPopup(loginRequest);
    writeStoredSource(source);
}

export async function logout(): Promise<void> {
    const session = await getActiveSession();
    clearStoredSource();
    if (!session) return;
    await session.client.logoutPopup({
        account: session.account,
        postLogoutRedirectUri: "/redirect",
    });
}

// Silent local teardown - used when a signed-in identity turns out not to be
// a registered contact. Clears MSAL state without a logout round-trip.
export async function clearSession(): Promise<void> {
    const session = await getActiveSession();
    clearStoredSource();
    if (!session) return;
    await session.client.clearCache();
    session.client.setActiveAccount(null);
}

// ── Token acquisition ────────────────────────────────────────────────────────
// Returns null on any failure - callers treat null as unauthenticated.
// Note: SilentRequest takes no prompt; only scopes + account are passed.

export async function acquireIdToken(): Promise<string | null> {
    try {
        const session = await getActiveSession();
        if (!session) return null;

        const response = await session.client.acquireTokenSilent({
            scopes: loginRequest.scopes,
            account: session.account,
        });

        return response.idToken ?? null;
    } catch {
        return null;
    }
}
