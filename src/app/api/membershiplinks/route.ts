import type { NextRequest, NextResponse } from "next/server";
import type {
    MembershipLinksResponse,
    MembershipLink,
} from "@/app/types/membership";
import { parseMembershipLinksRequest } from "@/app/lib/validate";
import { authorizeMember } from "@/app/lib/authorizeMember";
import { craftQuery, extractEntries } from "@/app/lib/craftClient";
import { UpstreamUnavailableError } from "@/app/lib/upstream";
import {
    deniedResponse,
    errorResponse,
    jsonNoStore,
    upstreamUnavailableResponse,
} from "@/app/lib/apiResponse";
import { logEvent, logSafeError } from "@/app/lib/safeLog";

// ─────────────────────────────────────────────────────────────────────────────
// All Craft access goes through craftClient (cache, single-flight, timeout).
// The fetch functions below THROW on failure; the handler decides how a partial
// or total failure is presented.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// QUERY 1 - LOCAL UNIT
// Fetches the local unit entry matching the member's primary facility code.
// facilityCode in Craft = accountnumber in Dataverse account table.
//
// REQUIRES: Craft GraphQL schema to expose `facilityCode` as a filter
// argument on the localUnits section. The field exists on entries (confirmed
// via Insomnia). Confirm the filter argument is exposed with Craft team
// before deploying to production.
//
// URL constructed from slug per spec: https://www.wsna.org/union/<slug>
// ─────────────────────────────────────────────────────────────────────────────
const LOCAL_UNIT_QUERY = `
    query($facilityCode: [String]) {
        entries(section: "localUnits", facilityCode: $facilityCode) {
            title
            slug
        }
    }
`;

async function fetchLocalUnit(
    facilityCode: string
): Promise<MembershipLink | null> {
    const data = await craftQuery(
        LOCAL_UNIT_QUERY,
        { facilityCode: [facilityCode] },
        `localUnit:${facilityCode}`
    );

    const entry = extractEntries(data)[0];
    if (!entry) return null;
    if (typeof entry.title !== "string" || typeof entry.slug !== "string") {
        return null;
    }

    return {
        title: entry.title,
        url: `https://www.wsna.org/union/${encodeURIComponent(entry.slug)}`,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY 2 - REGIONAL NURSES ASSOCIATION
// districtCode comes from wsna_district.wsna_name in Dataverse (e.g. "NW").
//
// Uses GraphQL variables exclusively - no string interpolation.
// regionCode is typed as [QueryArgument] to match the Craft CMS schema.
//
// Per spec:
// - Filter returned entries by typeHandle = "regionalNursesAssociation"
// - Multiple matches after filter = display nothing (log warning)
// - websiteUrl null = return title with url: null (plain text, no icon)
// ─────────────────────────────────────────────────────────────────────────────
const REGIONAL_QUERY = `
    query($regionCode: [QueryArgument]) {
        entries(section: "affialiateOrgs", regionCode: $regionCode) {
            title
            websiteUrl
            typeHandle
        }
    }
`;

async function fetchRegional(
    districtCode: string
): Promise<MembershipLink | null> {
    const data = await craftQuery(
        REGIONAL_QUERY,
        { regionCode: [districtCode] },
        `regional:${districtCode}`
    );

    const matches = extractEntries(data).filter(
        (e) =>
            e.typeHandle === "regionalNursesAssociation" &&
            typeof e.title === "string"
    );

    if (matches.length === 0) return null;

    // Per spec: multiple matches after type filter = display nothing
    if (matches.length > 1) {
        console.warn(
            `[membershiplinks] Multiple regionalNursesAssociation entries ` +
            `for district "${districtCode}" - displaying nothing per spec`
        );
        return null;
    }

    const match = matches[0];
    return {
        title: match.title as string,
        // Per spec: null url = render as plain text, no link, no icon
        url: typeof match.websiteUrl === "string" ? match.websiteUrl : null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY 3 - AFFILIATE ORGANISATIONS
// Single query fetches all affiliate orgs. Three sections are filtered from
// this one response:
//   - stateNursesAssociation  → WSNA Membership Benefits
//   - nationalNursesAssociation → National Nurses Association
//   - nationalUnion            → National Union (union members only)
//
// The query and its response are identical for every member (the union filter
// is applied AFTER the cached fetch), so one cache entry serves everyone.
//
// URL priority per spec: benefitsPageUrl → websiteUrl → null
// ─────────────────────────────────────────────────────────────────────────────
const AFFILIATE_QUERY = `
    {
        entries(section: "affialiateOrgs") {
            title
            websiteUrl
            benefitsPageUrl
            typeHandle
        }
    }
`;

interface AffiliateEntry {
    title: string;
    websiteUrl: string | null;
    benefitsPageUrl: string | null;
    typeHandle: string;
}

// Keeps only well-formed entries and normalises URL fields to string | null.
function toAffiliateEntries(
    entries: Record<string, unknown>[]
): AffiliateEntry[] {
    const result: AffiliateEntry[] = [];
    for (const e of entries) {
        if (typeof e.title !== "string" || typeof e.typeHandle !== "string") {
            continue;
        }
        result.push({
            title: e.title,
            typeHandle: e.typeHandle,
            websiteUrl: typeof e.websiteUrl === "string" ? e.websiteUrl : null,
            benefitsPageUrl:
                typeof e.benefitsPageUrl === "string" ? e.benefitsPageUrl : null,
        });
    }
    return result;
}

// Resolves URL per spec priority: benefitsPageUrl → websiteUrl → null
function resolveAffiliateUrl(entry: AffiliateEntry): string | null {
    return entry.benefitsPageUrl ?? entry.websiteUrl ?? null;
}

interface AffiliateResults {
    wsnaBenefits: MembershipLink | null;
    nationalNurses: MembershipLink | null;
    nationalUnion: MembershipLink | null;
}

const EMPTY_AFFILIATES: AffiliateResults = {
    wsnaBenefits: null,
    nationalNurses: null,
    nationalUnion: null,
};

async function fetchAffiliates(
    isUnionMember: boolean
): Promise<AffiliateResults> {
    const data = await craftQuery(AFFILIATE_QUERY, undefined, "affiliates");
    const entries = toAffiliateEntries(extractEntries(data));

    // ── WSNA Membership Benefits ──────────────────────────────────────────
    // Per spec: filter by typeHandle = "stateNursesAssociation"
    // Per spec: multiple entries = display alphabetically
    // No CRM condition - always shown if entry exists in Craft
    // (.filter() returns a NEW array, so sorting never mutates the cache.)
    const wsnaEntries = entries
        .filter((e) => e.typeHandle === "stateNursesAssociation")
        .sort((a, b) => a.title.localeCompare(b.title));

    const wsnaBenefits: MembershipLink | null =
        wsnaEntries.length > 0
            ? {
                title: wsnaEntries[0].title,
                url: resolveAffiliateUrl(wsnaEntries[0]),
            }
            : null;

    // ── National Nurses Association ───────────────────────────────────────
    // Per spec: multiple entries = display alphabetically
    // No CRM condition - always shown if entry exists in Craft
    const nnaEntries = entries
        .filter((e) => e.typeHandle === "nationalNursesAssociation")
        .sort((a, b) => a.title.localeCompare(b.title));

    const nationalNurses: MembershipLink | null =
        nnaEntries.length > 0
            ? {
                title: nnaEntries[0].title,
                url: resolveAffiliateUrl(nnaEntries[0]),
            }
            : null;

    // ── National Union ────────────────────────────────────────────────────
    // Per spec: only shown to union members (wsna_showaft = true)
    // Per spec: multiple entries = [DATA NEEDED from WSNA]
    // Current behaviour: use first entry, log warning if multiple found
    let nationalUnion: MembershipLink | null = null;

    if (isUnionMember) {
        const nuEntries = entries.filter((e) => e.typeHandle === "nationalUnion");

        if (nuEntries.length > 1) {
            console.warn(
                "[membershiplinks] Multiple nationalUnion entries found - " +
                "using first. Clarify handling with WSNA."
            );
        }

        if (nuEntries.length > 0) {
            nationalUnion = {
                title: nuEntries[0].title,
                url: resolveAffiliateUrl(nuEntries[0]),
            };
        }
    }

    return { wsnaBenefits, nationalNurses, nationalUnion };
}

// Each query is independent. A PARTIAL failure still returns what succeeded
// (the failed section is omitted). If EVERY query we attempted failed, the
// handler returns 503/500 instead of an empty 200: the client caches a
// successful response for the whole session, so an outage must not be cached
// as "this member has no links".
function logQueryFailure(label: string, reason: unknown): void {
    if (reason instanceof UpstreamUnavailableError) {
        logEvent("membershiplinks.query_failed", {
            query: label,
            reason: reason.reason,
        });
        return;
    }
    logSafeError(`membershiplinks:${label}`, reason);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// POST /api/membershiplinks
//
// authorizeMember enforces identity, the per-identity rate limit and Dataverse
// eligibility (via the proof cookie) BEFORE any Craft traffic. The three query
// groups then run in parallel via Promise.allSettled.
//
// Responses (all carry Cache-Control: private, no-store - CACHE-01):
//   200 - MembershipLinksResponse
//   400 - malformed request body
//   401 - missing or invalid credential
//   403 - authenticated but not an eligible member (AUTH-02)
//   429 - per-identity rate limit exceeded (Retry-After)
//   500 - unexpected server error
//   503 - Craft CMS unavailable for every attempted query (Retry-After)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // ── Authentication, throttling, eligibility ───────────────────────────
        const auth = await authorizeMember(req, "membershiplinks");
        if (auth.kind === "rejected") return auth.response;
        if (auth.kind === "denied") return deniedResponse(auth.reason);

        // Guard against empty body - can occur during Next.js dev-mode
        const contentLength = req.headers.get("content-length");
        const contentType = req.headers.get("content-type") ?? "";

        if (
            contentLength === "0" ||
            !contentType.includes("application/json")
        ) {
            return errorResponse("Request body is required", 400);
        }

        // ── Parse and validate request body ──────────────────────────────────
        // facilityCode and districtCode may be null (none assigned in CRM).
        // parseMembershipLinksRequest guarantees all three fields are present
        // and correctly typed.
        const parsed = await parseMembershipLinksRequest(req);
        if (parsed.error) return parsed.error;

        const { facilityCode, districtCode, isUnionMember } = parsed.data;

        // District codes from Dataverse are short uppercase alphanumeric
        // strings. Reject anything else - do not pass unexpected shapes to
        // external systems even via GraphQL variables.
        const safeDistrictCode =
            districtCode !== null && /^[A-Z0-9]{1,10}$/.test(districtCode)
                ? districtCode
                : null;

        if (districtCode !== null && safeDistrictCode === null) {
            logEvent("membershiplinks.invalid_district_code");
        }

        // ── Parallel Craft execution ──────────────────────────────────────────
        const wantsLocalUnit = facilityCode !== null;
        const wantsRegional = safeDistrictCode !== null;

        const [localSettled, regionalSettled, affiliatesSettled] =
            await Promise.allSettled([
                facilityCode !== null
                    ? fetchLocalUnit(facilityCode)
                    : Promise.resolve(null),
                safeDistrictCode !== null
                    ? fetchRegional(safeDistrictCode)
                    : Promise.resolve(null),
                fetchAffiliates(isUnionMember),
            ]);

        const failures: unknown[] = [];
        let attempted = 0;

        const collect = <T,>(
            wasAttempted: boolean,
            label: string,
            settled: PromiseSettledResult<T | null>
        ): T | null => {
            if (!wasAttempted) return null;
            attempted += 1;
            if (settled.status === "fulfilled") return settled.value;
            failures.push(settled.reason);
            logQueryFailure(label, settled.reason);
            return null;
        };

        const localUnit = collect(wantsLocalUnit, "localUnit", localSettled);
        const regional = collect(wantsRegional, "regional", regionalSettled);
        const affiliates =
            collect(true, "affiliates", affiliatesSettled) ?? EMPTY_AFFILIATES;

        // Everything we tried failed: do not return (and let the client cache)
        // an empty success.
        if (attempted > 0 && failures.length === attempted) {
            const unavailable = failures.find(
                (f): f is UpstreamUnavailableError =>
                    f instanceof UpstreamUnavailableError
            );
            if (unavailable) return upstreamUnavailableResponse(unavailable);
            return errorResponse("Server error loading membership links", 500);
        }

        const response: MembershipLinksResponse = {
            localUnits: localUnit ? [localUnit] : [],
            regional,
            wsnaBenefits: affiliates.wsnaBenefits,
            nationalNurses: affiliates.nationalNurses,
            nationalUnion: affiliates.nationalUnion,
        };

        return auth.applyProof(jsonNoStore(response));
    } catch (err) {
        logSafeError("api/membershiplinks", err);
        return errorResponse("Server error loading membership links", 500);
    }
}