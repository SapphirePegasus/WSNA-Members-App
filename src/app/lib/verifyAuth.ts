import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose";
import type { JWTVerifyGetKey } from "jose";
import {
    getMsalClientId,
    getExternalClientId,
    getExternalTenantId,
    getExternalTenantSubdomain,
    getWorkforceTenantId,
} from "@/app/lib/env";

// ─────────────────────────────────────────────────────────────────────────────
// Shared JWT verification - a CLOSED allowlist of exactly three issuers.
//
//   1. WSNA workforce tenant      - @wsna.org staff
//   2. Microsoft consumer tenant  - personal Microsoft accounts (MSA)
//   3. WSNA external tenant       - email one-time-passcode users (CIAM)
//
// The token's unverified `iss` claim is used ONLY to select an entry from
// this closed map - never to construct a URL or an expected value. Each
// entry pins its own issuer string, JWKS endpoint, expected audience, and
// expected tid. This is what makes the multi-issuer setup safe: a token
// from any other tenant fails the map lookup and is rejected before any
// cryptographic work happens.
//
// (Historical note: the previous implementation derived the expected issuer
// from the token's own tid claim, which accepted tokens from arbitrary
// tenants and allowed impersonation via unverified preferred_username.
// Do not reintroduce that pattern.)
// ─────────────────────────────────────────────────────────────────────────────

// Fixed, well-known tenant ID for personal Microsoft accounts. This is a
// Microsoft platform constant, not WSNA configuration.
const MSA_TENANT_ID = "9188040d-6c67-4c5b-b112-36a304b66dad";

interface TrustedIssuer {
    issuer: string;
    tenantId: string;
    audience: string;
    jwks: JWTVerifyGetKey;
}

// Built lazily on first use and cached. Lazy so that a missing env var
// surfaces as a 500 on the first API call (fail closed, clear log line)
// instead of crashing route modules at import time.
let trustedIssuers: Map<string, TrustedIssuer> | null = null;

function getTrustedIssuers(): Map<string, TrustedIssuer> {
    if (trustedIssuers) return trustedIssuers;

    const workforceTenantId = getWorkforceTenantId();
    const workforceAudience = getMsalClientId();
    const externalTenantId = getExternalTenantId();
    const externalSubdomain = getExternalTenantSubdomain();

    const entries: TrustedIssuer[] = [
        {
            issuer: `https://login.microsoftonline.com/${workforceTenantId}/v2.0`,
            tenantId: workforceTenantId,
            audience: workforceAudience,
            jwks: createRemoteJWKSet(
                new URL(
                    `https://login.microsoftonline.com/${workforceTenantId}/discovery/v2.0/keys`
                )
            ),
        },
        {
            issuer: `https://login.microsoftonline.com/${MSA_TENANT_ID}/v2.0`,
            tenantId: MSA_TENANT_ID,
            // MSA users sign in through the same multi-tenant workforce app
            // registration, so their tokens carry the workforce client ID.
            audience: workforceAudience,
            jwks: createRemoteJWKSet(
                new URL(
                    `https://login.microsoftonline.com/${MSA_TENANT_ID}/discovery/v2.0/keys`
                )
            ),
        },
        {
            // External ID quirk (verified against the tenant's discovery
            // document): the issuer host is {tenant-id}.ciamlogin.com while
            // the jwks_uri host is {subdomain}.ciamlogin.com.
            issuer: `https://${externalTenantId}.ciamlogin.com/${externalTenantId}/v2.0`,
            tenantId: externalTenantId,
            audience: getExternalClientId(),
            jwks: createRemoteJWKSet(
                new URL(
                    `https://${externalSubdomain}.ciamlogin.com/${externalTenantId}/discovery/v2.0/keys`
                )
            ),
        },
    ];

    trustedIssuers = new Map(entries.map((entry) => [entry.issuer, entry]));
    return trustedIssuers;
}

export class VerifyAuthError extends Error {
    constructor(
        message: string,
        public readonly status: 401 | 403 | 422
    ) {
        super(message);
        this.name = "VerifyAuthError";
    }
}

export async function verifyAuth(req: Request): Promise<string> {
    // ── Step 1: Extract token ───────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        throw new VerifyAuthError(
            "Missing or malformed Authorization header",
            401
        );
    }

    const idToken = authHeader.slice(7);

    // ── Step 2: Select the trusted issuer ───────────────────────────────────
    // decodeJwt performs NO signature verification. Its output is used only
    // to look up an entry in the closed allowlist above.
    let trusted: TrustedIssuer;
    try {
        const unverifiedIssuer = decodeJwt(idToken).iss;
        const match = unverifiedIssuer
            ? getTrustedIssuers().get(unverifiedIssuer)
            : undefined;

        if (!match) {
            throw new VerifyAuthError("Token issued by untrusted issuer", 401);
        }
        trusted = match;
    } catch (err) {
        if (err instanceof VerifyAuthError) throw err;
        throw new VerifyAuthError("Failed to decode token", 401);
    }

    // ── Step 3: Verify signature and claims against the pinned entry ────────
    let email: string;
    try {
        const { payload } = await jwtVerify(idToken, trusted.jwks, {
            issuer: trusted.issuer,
            audience: trusted.audience,
        });

        // Defence in depth - the pinned issuer already implies the tenant,
        // but assert tid explicitly so a future issuer-format change cannot
        // silently widen which tenant is accepted.
        if (payload.tid !== trusted.tenantId) {
            throw new VerifyAuthError("Token issued by unexpected tenant", 401);
        }

        const rawEmail =
            (payload.email as string | undefined) ??
            (payload.preferred_username as string | undefined);

        if (!rawEmail) {
            throw new VerifyAuthError(
                "Token does not contain a verifiable email claim",
                422
            );
        }

        email = rawEmail;
    } catch (err) {
        if (err instanceof VerifyAuthError) throw err;
        throw new VerifyAuthError("Invalid or expired token", 401);
    }

    return email;
}
