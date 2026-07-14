import { createRemoteJWKSet, jwtVerify } from "jose";
import {
    getMsalClientId,
    getExternalTenantId,
    getExternalTenantSubdomain,
} from "@/app/lib/env";

// ─────────────────────────────────────────────────────────────────────────────
// Shared JWT verification utility.
// Single source of truth for token verification across all protected API
// routes. Uses the same JWKS endpoint and verification logic as
// /api/contact/route.ts - do NOT duplicate this logic in individual routes.
//
// Returns the verified email claim on success.
// Throws a VerifyAuthError with an HTTP status and message on failure.
// Callers catch this and return the appropriate NextResponse.
// ─────────────────────────────────────────────────────────────────────────────

const TENANT_ID = getExternalTenantId();
const SUBDOMAIN = getExternalTenantSubdomain();

const JWKS = createRemoteJWKSet(
    new URL(
        `https://${SUBDOMAIN}.ciamlogin.com/${TENANT_ID}/discovery/v2.0/keys`
    )
);

const ISSUER = `https://${TENANT_ID}.ciamlogin.com/${TENANT_ID}/v2.0`;

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

    // ── Step 2: Verify signature and claims ────────────────────────────────
    // No pre-decode step. Issuer and audience are pinned constants, so
    // nothing is read out of the token before its signature is checked.
    let email: string;
    try {
        const { payload } = await jwtVerify(idToken, JWKS, {
            issuer: ISSUER,
            audience: getMsalClientId(),
        });

        // Defence in depth - the pinned issuer already guarantees this,
        // but assert tid explicitly so a future issuer change cannot
        // silently widen which tenant is accepted.
        if (payload.tid !== TENANT_ID) {
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