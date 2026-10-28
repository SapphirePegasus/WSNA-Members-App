import type { NextRequest, NextResponse } from "next/server";
import { verifyAuth, VerifyAuthError } from "@/app/lib/verifyAuth";
import { normalizeEmail } from "@/app/lib/email";
import { createPerMinuteLimiter, type TokenBucketLimiter } from "@/app/lib/rateLimit";
import {
    getContactByEmail,
    type ContactRecord,
} from "@/app/dataverse/contactRepository";
import {
    ELIGIBILITY_COOKIE_NAME,
    eligibilityCookieOptions,
    issueEligibilityProof,
    verifyEligibilityProof,
} from "@/app/lib/eligibilityProof";
import {
    errorResponse,
    internalErrorResponse,
    tooManyRequestsResponse,
    upstreamUnavailableResponse,
    type DenialReason,
} from "@/app/lib/apiResponse";
import { UpstreamUnavailableError } from "@/app/lib/upstream";
import { logEvent, logSafeError } from "@/app/lib/safeLog";
import { LIMITS } from "@/config/limits";

// ─────────────────────────────────────────────────────────────────────────────
// AUTHORIZE MEMBER (AUTH-02)
//
// The single server-side gate for member-only API routes, cheapest check first:
//   1. verifyAuth   - valid identity token (local crypto, no network)
//   2. rate limit   - per verified, normalised email, per route
//   3. eligibility  - Dataverse says this identity is an eligible member
//        /api/contact : always a real lookup (the response carries the record)
//        Craft routes : a valid signed proof skips Dataverse entirely;
//                       otherwise fall back to a lookup and re-issue the proof
//
// Outcomes are a discriminated union, so a caller cannot forget a case:
//   eligible - proceed; call applyProof(response) on the success response
//   denied   - authenticated but not eligible
//   rejected - a ready-made 401 / 429 / 503 / 500 response; return it as-is
//
// An outage is NEVER "denied": upstream failures are always 503 + Retry-After.
// The proof is issued only after a real lookup and never refreshed by use, so
// its expiry is absolute since the last Dataverse check.
// ─────────────────────────────────────────────────────────────────────────────

type GuardedRoute = "contact" | "resources" | "membershiplinks";
export type MemberRoute = Exclude<GuardedRoute, "contact">;

type Denied = { kind: "denied"; reason: DenialReason };
type Rejected = { kind: "rejected"; response: NextResponse };

export type ContactAuthorization =
    | {
        kind: "eligible";
        contact: ContactRecord;
        applyProof: (response: NextResponse) => NextResponse;
    }
    | Denied
    | Rejected;

export type MemberAuthorization =
    | { kind: "eligible"; applyProof: (response: NextResponse) => NextResponse }
    | Denied
    | Rejected;

// One limiter per route so a busy route cannot starve another for the same
// identity. Module-level: one set per server instance.
const limiters: Record<GuardedRoute, TokenBucketLimiter> = {
    contact: createPerMinuteLimiter(
        LIMITS.identity.contactPerMinute,
        LIMITS.rateLimiter.maxKeys
    ),
    resources: createPerMinuteLimiter(
        LIMITS.identity.resourcesPerMinute,
        LIMITS.rateLimiter.maxKeys
    ),
    membershiplinks: createPerMinuteLimiter(
        LIMITS.identity.membershipLinksPerMinute,
        LIMITS.rateLimiter.maxKeys
    ),
};

type AuthenticationOutcome =
    | { ok: true; email: string | null } // null => token email unusable
    | { ok: false; response: NextResponse };

async function authenticate(
    req: NextRequest,
    route: GuardedRoute
): Promise<AuthenticationOutcome> {
    let rawEmail: string;
    try {
        rawEmail = await verifyAuth(req);
    } catch (err) {
        if (err instanceof VerifyAuthError) {
            // The specific reason stays out of the response (it would help an
            // attacker probe); it is logged as a metric instead.
            logEvent("auth.rejected", { route, status: err.status });
            return {
                ok: false,
                response: errorResponse("Authentication failed", err.status),
            };
        }
        logSafeError("authorizeMember", err);
        return { ok: false, response: errorResponse("Authentication failed", 401) };
    }

    const email = normalizeEmail(rawEmail);
    if (email === null) return { ok: true, email: null };

    const decision = limiters[route].consume(email);
    if (!decision.allowed) {
        logEvent("api.rate_limited", { route });
        return {
            ok: false,
            response: tooManyRequestsResponse(decision.retryAfterSeconds),
        };
    }

    return { ok: true, email };
}

function failureResponse(route: GuardedRoute, err: unknown): NextResponse {
    if (err instanceof UpstreamUnavailableError) {
        logEvent("api.unavailable", { route, reason: err.reason });
        return upstreamUnavailableResponse(err);
    }
    // Configuration faults, Dataverse 4xx, anything unexpected: logged safely;
    // the caller only sees a generic 500.
    logSafeError(`authorizeMember:${route}`, err);
    return internalErrorResponse();
}

function setProof(response: NextResponse, token: string): NextResponse {
    response.cookies.set(ELIGIBILITY_COOKIE_NAME, token, eligibilityCookieOptions());
    return response;
}

function denial(route: GuardedRoute, reason: DenialReason): Denied {
    logEvent("eligibility.denied", { route, reason });
    return { kind: "denied", reason };
}

// ── /api/contact ─────────────────────────────────────────────────────────────
export async function authorizeContactLookup(
    req: NextRequest
): Promise<ContactAuthorization> {
    const identity = await authenticate(req, "contact");
    if (!identity.ok) return { kind: "rejected", response: identity.response };
    if (identity.email === null) return denial("contact", "not-registered");

    try {
        const result = await getContactByEmail(identity.email);

        if (result === null) return denial("contact", "not-registered");
        if (result === "unrecognized") return denial("contact", "unrecognized");

        const proof = issueEligibilityProof(identity.email);
        logEvent("eligibility.check", { route: "contact", source: "lookup" });

        return {
            kind: "eligible",
            contact: result,
            applyProof: (response) => setProof(response, proof),
        };
    } catch (err) {
        return { kind: "rejected", response: failureResponse("contact", err) };
    }
}

// ── Craft-backed routes ──────────────────────────────────────────────────────
export async function authorizeMember(
    req: NextRequest,
    route: MemberRoute
): Promise<MemberAuthorization> {
    const identity = await authenticate(req, route);
    if (!identity.ok) return { kind: "rejected", response: identity.response };
    if (identity.email === null) return denial(route, "not-registered");

    try {
        // Fast path: a valid proof means this identity passed the Dataverse
        // check within the last proof lifetime. No Dataverse call at all.
        const proofCookie = req.cookies.get(ELIGIBILITY_COOKIE_NAME)?.value;
        if (verifyEligibilityProof(proofCookie, identity.email)) {
            logEvent("eligibility.check", { route, source: "proof" });
            // Deliberately NOT re-issued: using the proof must not extend it.
            return { kind: "eligible", applyProof: (response) => response };
        }

        // Slow path: missing, expired, tampered, or another account's proof.
        const result = await getContactByEmail(identity.email);

        if (result === null) return denial(route, "not-registered");
        if (result === "unrecognized") return denial(route, "unrecognized");

        const fresh = issueEligibilityProof(identity.email);
        logEvent("eligibility.check", { route, source: "lookup" });

        return {
            kind: "eligible",
            applyProof: (response) => setProof(response, fresh),
        };
    } catch (err) {
        return { kind: "rejected", response: failureResponse(route, err) };
    }
}