import { NextResponse } from "next/server";
import {
    ELIGIBILITY_COOKIE_NAME,
    eligibilityCookieOptions,
} from "@/app/lib/eligibilityProof";
import type { UpstreamUnavailableError } from "@/app/lib/upstream";

// ─────────────────────────────────────────────────────────────────────────────
// Response builders shared by every protected API route.
// Every response - success AND error - carries Cache-Control: private,
// no-store (CACHE-01). Error bodies are generic: callers learn the class of
// failure, never internals.
// ─────────────────────────────────────────────────────────────────────────────

const NO_STORE = "private, no-store";

// Stable, machine-readable denial classes; they never expose member data.
// (Duplicate matches are folded into "not-registered" by design.)
export type DenialReason = "not-registered" | "unrecognized";

interface JsonOptions {
    status?: number;
    headers?: Record<string, string>;
}

export function jsonNoStore(body: unknown, options: JsonOptions = {}): NextResponse {
    return NextResponse.json(body, {
        status: options.status ?? 200,
        headers: { "Cache-Control": NO_STORE, ...options.headers },
    });
}

export function errorResponse(
    message: string,
    status: number,
    headers?: Record<string, string>
): NextResponse {
    return jsonNoStore({ error: message }, { status, headers });
}

export function tooManyRequestsResponse(retryAfterSeconds: number): NextResponse {
    return errorResponse("Too many requests. Please try again shortly.", 429, {
        "Retry-After": String(retryAfterSeconds),
    });
}

// An upstream (Dataverse / Craft) cannot serve the request right now. This is
// NOT an eligibility decision.
export function upstreamUnavailableResponse(err: UpstreamUnavailableError): NextResponse {
    return errorResponse(
        "This service is temporarily unavailable. Please try again shortly.",
        503,
        { "Retry-After": String(err.retryAfterSeconds) }
    );
}

export function internalErrorResponse(): NextResponse {
    return errorResponse("Internal server error", 500);
}

// Clears the proof cookie. Used on any denial so a member whose eligibility
// was revoked loses the Craft-route shortcut on this device immediately.
export function clearEligibilityCookie(response: NextResponse): NextResponse {
    response.cookies.set(ELIGIBILITY_COOKIE_NAME, "", {
        ...eligibilityCookieOptions(),
        maxAge: 0,
    });
    return response;
}

export function deniedResponse(reason: DenialReason): NextResponse {
    return clearEligibilityCookie(
        jsonNoStore(
            {
                error: "Your account is not eligible to access this content.",
                reason,
            },
            { status: 403 }
        )
    );
}