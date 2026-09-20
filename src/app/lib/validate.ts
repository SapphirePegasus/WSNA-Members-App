import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight request validation.
// All validation is done with native TypeScript and regex.
//
// Design principles:
//   - Never throws - always returns a typed result
//   - Validates type AND shape AND format in one pass
//   - Returns only the first error to avoid schema enumeration by attackers
//   - Strips unknown fields from parsed output - never pass raw input downstream
// ─────────────────────────────────────────────────────────────────────────────

// ── Result type ───────────────────────────────────────────────────────────────
type ValidationSuccess<T> = { data: T; error: null };
type ValidationFailure = { data: null; error: NextResponse };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function fail(message: string, status: 400 | 415 = 400): ValidationFailure {
    return {
        data: null,
        error: NextResponse.json({ error: message }, { status }),
    };
}

// ── Body parser ───────────────────────────────────────────────────────────────
// Parses and validates a JSON request body.
// Callers check result.error first and return it if present.
//
// Usage:
//   const result = await parseJsonBody(req);
//   if (result.error) return result.error;
//   const raw = result.data;
async function parseJsonBody(
    req: Request
): Promise<ValidationResult<unknown>> {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        return fail("Content-Type must be application/json", 415);
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength === "0") {
        return fail("Request body is required");
    }

    try {
        const data = await req.json();
        return { data, error: null };
    } catch {
        return fail("Invalid JSON in request body");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP LINKS REQUEST
// ─────────────────────────────────────────────────────────────────────────────
export interface ValidatedMembershipLinksRequest {
    facilityCode: string | null;
    districtCode: string | null;
    isUnionMember: boolean;
}

// facilityCode: accountnumber - uppercase alphanumeric, max 20 chars
// districtCode: wsna_name - uppercase alphanumeric, max 10 chars
const FACILITY_CODE_PATTERN = /^[A-Z0-9]{1,20}$/;
const DISTRICT_CODE_PATTERN = /^[A-Z0-9]{1,10}$/;

export async function parseMembershipLinksRequest(
    req: Request
): Promise<ValidationResult<ValidatedMembershipLinksRequest>> {
    const bodyResult = await parseJsonBody(req);
    if (bodyResult.error) return bodyResult as ValidationFailure;

    const raw = bodyResult.data;

    // Must be a plain object - reject arrays, primitives, null
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        return fail("Request body must be a JSON object");
    }

    const obj = raw as Record<string, unknown>;

    // ── facilityCode ───────────────────────────────────────────────────────
    if (!("facilityCode" in obj)) {
        return fail("Missing required field: facilityCode");
    }
    if (obj.facilityCode !== null && typeof obj.facilityCode !== "string") {
        return fail("facilityCode must be a string or null");
    }
    if (typeof obj.facilityCode === "string") {
        if (!FACILITY_CODE_PATTERN.test(obj.facilityCode)) {
            return fail("facilityCode format is invalid");
        }
    }

    // ── districtCode ───────────────────────────────────────────────────────
    if (!("districtCode" in obj)) {
        return fail("Missing required field: districtCode");
    }
    if (obj.districtCode !== null && typeof obj.districtCode !== "string") {
        return fail("districtCode must be a string or null");
    }
    if (typeof obj.districtCode === "string") {
        if (!DISTRICT_CODE_PATTERN.test(obj.districtCode)) {
            return fail("districtCode format is invalid");
        }
    }

    // ── isUnionMember ──────────────────────────────────────────────────────
    if (!("isUnionMember" in obj)) {
        return fail("Missing required field: isUnionMember");
    }
    if (typeof obj.isUnionMember !== "boolean") {
        return fail("isUnionMember must be a boolean");
    }

    // Return only the fields we expect - unknown fields are dropped
    return {
        data: {
            facilityCode: obj.facilityCode as string | null,
            districtCode: obj.districtCode as string | null,
            isUnionMember: obj.isUnionMember,
        },
        error: null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCES SECTION PARAM
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_PATTERN = /^[a-zA-Z0-9_]{1,100}$/;

export function validateSectionParam(
    section: string | null | undefined
): ValidationResult<string> {
    if (!section) {
        return fail("Missing required query parameter: section");
    }
    if (!SECTION_PATTERN.test(section)) {
        return fail("Invalid section parameter format");
    }
    return { data: section, error: null };
}