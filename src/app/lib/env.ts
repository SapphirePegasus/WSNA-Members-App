// ─────────────────────────────────────────────────────────────────────────────
// Environment variable access.
// Each function validates and returns exactly one variable.
//
// IMPORTANT - Next.js static replacement rule:
// NEXT_PUBLIC_ variables are inlined at build time by Next.js using static
// analysis. This only works with literal access: process.env.NEXT_PUBLIC_FOO
// Dynamic access like process.env[key] is NOT replaced and resolves as
// undefined in the client bundle. Public getters below use literal access
// for this reason. Server getters use dynamic access since they only run
// in Node.js where full runtime process.env is available.
//
// Rules:
//   - Never access process.env directly outside this file
//   - Never use the ! assertion on process.env values
//   - Import only what your module needs
//
// Usage:
//   import { getCraftToken, getWsnaApiBase } from "@/app/lib/env";
//   const token = getCraftToken();
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(key: string, value: string | undefined): string {
    if (!value || value.trim() === "") {
        throw new Error(
            `[env] Missing required environment variable: ${key}\n` +
            `Check your .env.local file and Vercel environment configuration.`
        );
    }
    return value.trim();
}

function requireServerEnv(key: string): string {
    const value = process.env[key];
    if (!value || value.trim() === "") {
        throw new Error(
            `[env] Missing required environment variable: ${key}\n` +
            `Check your .env.local file and Vercel environment configuration.`
        );
    }
    return value.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER-SIDE ONLY
// Dynamic process.env access is fine here - these only run in Node.js.
// Never import these in client components.
// ─────────────────────────────────────────────────────────────────────────────
export function getCraftToken(): string {
    return requireServerEnv("CRAFT_GRAPHQL_TOKEN");
}

export function getDataverseTenantId(): string {
    return requireServerEnv("DATAVERSE_TENANT_ID");
}

export function getDataverseClientId(): string {
    return requireServerEnv("DATAVERSE_CLIENT_ID");
}

export function getDataverseClientSecret(): string {
    return requireServerEnv("DATAVERSE_CLIENT_SECRET");
}

export function getDataverseUrl(): string {
    return requireServerEnv("DATAVERSE_URL");
}

// ─────────────────────────────────────────────────────────────────────────────
// ELIGIBILITY PROOF SECRET - server-side only. Signs the eligibility proof
// cookie. High-entropy, at least 32 characters. Generate with:
//   openssl rand -base64 48
// Use a DIFFERENT value for Production and Preview. Never prefix it with
// NEXT_PUBLIC_. Rotating it only costs each active user one fresh lookup.
// ─────────────────────────────────────────────────────────────────────────────
const ELIGIBILITY_SECRET_MIN_LENGTH = 32;

export function getEligibilityProofSecret(): string {
    const value = requireServerEnv("ELIGIBILITY_PROOF_SECRET");
    if (value.length < ELIGIBILITY_SECRET_MIN_LENGTH) {
        throw new Error(
            `[env] ELIGIBILITY_PROOF_SECRET must be at least ` +
            `${ELIGIBILITY_SECRET_MIN_LENGTH} characters. ` +
            `Generate one with: openssl rand -base64 48`
        );
    }
    return value;
}

// Centralised so no other module reads NODE_ENV directly for security
// decisions (cookie flags, cookie name).
export function isProduction(): boolean {
    return process.env.NODE_ENV === "production";
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC (CLIENT + SERVER)
// Must use literal process.env.NEXT_PUBLIC_* access - Next.js static
// analysis cannot inline dynamic process.env[key] lookups into the
// client bundle, causing undefined at runtime in the browser.
// ─────────────────────────────────────────────────────────────────────────────
export function getWsnaApiBase(): string {
    return requireEnv(
        "NEXT_PUBLIC_WSNA_API_BASE",
        process.env.NEXT_PUBLIC_WSNA_API_BASE
    );
}

export function getMsalClientId(): string {
    return requireEnv(
        "NEXT_PUBLIC_MSAL_CLIENT_ID",
        process.env.NEXT_PUBLIC_MSAL_CLIENT_ID
    );
}

export function getMsalTenant(): string {
    return requireEnv(
        "NEXT_PUBLIC_MSAL_TENANT",
        process.env.NEXT_PUBLIC_MSAL_TENANT
    );
}

export function getMsalRedirectUri(): string {
    return requireEnv(
        "NEXT_PUBLIC_MSAL_REDIRECT_URI",
        process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL TENANT (Entra External ID / CIAM) - email one-time-passcode sign-in
// Tenant ID and subdomain are public configuration - they appear in every
// authentication URL the browser visits, so NEXT_PUBLIC_ exposure is safe.
// ─────────────────────────────────────────────────────────────────────────────
export function getExternalClientId(): string {
    return requireEnv(
        "NEXT_PUBLIC_EXTERNAL_CLIENT_ID",
        process.env.NEXT_PUBLIC_EXTERNAL_CLIENT_ID
    );
}

export function getExternalTenantId(): string {
    return requireEnv(
        "NEXT_PUBLIC_EXTERNAL_TENANT_ID",
        process.env.NEXT_PUBLIC_EXTERNAL_TENANT_ID
    );
}

export function getExternalTenantSubdomain(): string {
    return requireEnv(
        "NEXT_PUBLIC_EXTERNAL_TENANT_SUBDOMAIN",
        process.env.NEXT_PUBLIC_EXTERNAL_TENANT_SUBDOMAIN
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKFORCE TENANT ID - server-side only.
// Used exclusively by verifyAuth to pin the issuer for @wsna.org tokens.
// The client keeps using the "common" authority (NEXT_PUBLIC_MSAL_TENANT),
// so this must be the concrete tenant GUID, never "common".
// ─────────────────────────────────────────────────────────────────────────────
export function getWorkforceTenantId(): string {
    const value = requireServerEnv("WORKFORCE_TENANT_ID");
    if (value === "common" || value === "organizations" || value === "consumers") {
        throw new Error(
            "[env] WORKFORCE_TENANT_ID must be the tenant GUID, not an alias. " +
            "Aliases cannot be used for issuer pinning."
        );
    }
    return value;
}