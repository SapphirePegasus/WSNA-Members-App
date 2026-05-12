import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose";

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

const JWKS = createRemoteJWKSet(
    new URL(
        "https://login.microsoftonline.com/common/discovery/v2.0/keys"
    )
);

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

    // ── Step 2: Decode to extract tenant ID ────────────────────────────────
    let tid: string;
    try {
        const decoded = decodeJwt(idToken);
        tid = decoded.tid as string;

        if (!tid) {
            throw new VerifyAuthError("Token missing tid claim", 401);
        }
    } catch (err) {
        if (err instanceof VerifyAuthError) throw err;
        throw new VerifyAuthError("Failed to decode token", 401);
    }

    // ── Step 3: Verify signature and claims ────────────────────────────────
    let email: string;
    try {
        const { payload } = await jwtVerify(idToken, JWKS, {
            issuer: `https://login.microsoftonline.com/${tid}/v2.0`,
            audience: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID,
        });

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