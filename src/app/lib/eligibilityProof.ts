import { createHmac, timingSafeEqual } from "node:crypto";
import { getEligibilityProofSecret, isProduction } from "@/app/lib/env";
import { LIMITS } from "@/config/limits";

// ─────────────────────────────────────────────────────────────────────────────
// ELIGIBILITY PROOF
//
// A short-lived value signed by OUR server meaning: "this identity passed the
// Dataverse eligibility check recently". It lets the Craft-backed routes skip
// Dataverse on every call, with no shared store, on any server instance.
//
// It is NOT authentication. A valid identity token is always required first;
// the proof only answers "was this identity checked lately?". Stolen alone it
// grants nothing, and it is bound to one identity.
//
// Format:  v1.<expiresAtEpochSeconds>.<HMAC-SHA256, base64url>
// The MAC covers version + expiry + the normalised email. The email itself is
// never stored in the cookie. Expiry is also bounded on verify, so a forged
// far-future expiry is rejected even before the MAC check.
//
// Rotation: change ELIGIBILITY_PROOF_SECRET and redeploy. Outstanding proofs
// stop validating and each active user costs one fresh lookup.
// ─────────────────────────────────────────────────────────────────────────────

const VERSION = "v1";
const EXPIRY_PATTERN = /^\d{1,12}$/;

function sign(expiresAt: number, normalizedEmail: string): string {
    return createHmac("sha256", getEligibilityProofSecret())
        .update(`${VERSION}.${expiresAt}.${normalizedEmail}`)
        .digest("base64url");
}

// Callers pass an email already canonicalised by normalizeEmail().
export function issueEligibilityProof(normalizedEmail: string): string {
    const expiresAt = Math.floor(Date.now() / 1_000) + LIMITS.proof.ttlSeconds;
    return `${VERSION}.${expiresAt}.${sign(expiresAt, normalizedEmail)}`;
}

// True only for a proof that is authentic, unexpired and bound to exactly this
// identity. Any other outcome is false (never throws on a bad token).
export function verifyEligibilityProof(
    token: string | undefined,
    normalizedEmail: string
): boolean {
    if (!token) return false;

    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== VERSION) return false;
    if (!EXPIRY_PATTERN.test(parts[1])) return false;

    const expiresAt = Number(parts[1]);
    const now = Math.floor(Date.now() / 1_000);
    if (expiresAt <= now || expiresAt > now + LIMITS.proof.ttlSeconds) return false;

    const expected = Buffer.from(sign(expiresAt, normalizedEmail));
    const actual = Buffer.from(parts[2]);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ── Cookie contract ─────────────────────────────────────────────────────────
// __Secure- prefix: browsers refuse it without the Secure attribute. Omitted
// outside production because some browsers reject Secure cookies over plain
// http://localhost, which would break local development.
export const ELIGIBILITY_COOKIE_NAME = isProduction()
    ? "__Secure-wsna_eligibility"
    : "wsna_eligibility";

export function eligibilityCookieOptions() {
    return {
        httpOnly: true, // invisible to JavaScript
        secure: isProduction(),
        sameSite: "strict" as const,
        path: "/api", // sent only to API routes
        maxAge: LIMITS.proof.ttlSeconds,
    };
}