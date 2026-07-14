import { NextResponse } from "next/server";
import type {
    MembershipLinksResponse,
    MembershipLink,
} from "@/app/types/membership";
import { parseMembershipLinksRequest } from "@/app/lib/validate";
import { verifyAuth, VerifyAuthError } from "@/app/lib/verifyAuth";
import { getCraftToken, getWsnaApiBase } from "@/app/lib/env";

// ─────────────────────────────────────────────────────────────────────────────
// GRAPHQL FETCHER
// Single responsibility - HTTP transport and error handling only.
// All query construction happens in the individual fetch functions below.
// Throws on non-2xx or GraphQL errors - callers handle gracefully.
//
// Note: next.revalidate is intentionally omitted here. Next.js does not
// apply fetch caching to calls made inside POST route handlers. Caching
// for membership links is handled at the client layer via the
// useMembershipLinks hook (module-level cache keyed by contactId,
// session-scoped). No duplicate network requests occur in normal usage.
// ─────────────────────────────────────────────────────────────────────────────
async function craftQuery<T>(
    query: string,
    variables?: Record<string, unknown>
): Promise<T> {
    const res = await fetch(getWsnaApiBase(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${getCraftToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
        throw new Error(
            `Craft GraphQL request failed: ${res.status} ${res.statusText}`
        );
    }

    const json = await res.json();

    if (json.errors?.length) {
        const messages = json.errors
            .map((e: { message: string }) => e.message)
            .join("; ");
        throw new Error(`Craft GraphQL errors: ${messages}`);
    }

    return json.data as T;
}

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

interface LocalUnitQueryResult {
    entries: Array<{
        title: string;
        slug: string;
    }>;
}

async function fetchLocalUnit(
    facilityCode: string
): Promise<MembershipLink | null> {
    try {
        const data = await craftQuery<LocalUnitQueryResult>(
            LOCAL_UNIT_QUERY,
            { facilityCode: [facilityCode] }
        );

        const entry = data.entries?.[0];
        if (!entry) return null;

        return {
            title: entry.title,
            url: `https://www.wsna.org/union/${entry.slug}`,
        };
    } catch (err) {
        // Isolated failure - does not affect other link sections
        console.error("[membershiplinks] Local unit fetch failed:", err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY 2 - REGIONAL NURSES ASSOCIATION
// districtCode comes from wsna_district.wsna_name in Dataverse (e.g. "NW").
//
// regionCode is inlined as a string literal rather than passed as a typed
// GraphQL variable. Craft's regionCode argument expects type [QueryArgument]
// - a union scalar that accepts strings, integers, and booleans. When a
// variable is declared as [String], Craft rejects the query because [String]
// does not satisfy [QueryArgument] even though the value itself is valid.
// Inlining the value bypasses the type mismatch entirely.
//
// Per spec:
// - Filter returned entries by typeHandle = "regionalNursesAssociation"
// - Multiple matches after filter = display nothing (log warning)
// - websiteUrl null = return title with url: null (plain text, no icon)
// ─────────────────────────────────────────────────────────────────────────────
//
// Uses GraphQL variables exclusively - no string interpolation.
// regionCode is typed as [QueryArgument] to match the Craft CMS schema.
// This is the correct type for Craft filter arguments and resolves the
// type mismatch that previously forced inline string interpolation.
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

interface RegionalQueryResult {
    entries: Array<{
        title: string;
        websiteUrl: string | null;
        typeHandle: string;
    }>;
}

async function fetchRegional(
    districtCode: string
): Promise<MembershipLink | null> {
    try {
        const data = await craftQuery<RegionalQueryResult>(
            REGIONAL_QUERY,
            { regionCode: [districtCode] }
        );

        const matches = data.entries?.filter(
            (e) => e.typeHandle === "regionalNursesAssociation"
        );

        if (!matches || matches.length === 0) return null;

        // Per spec: multiple matches after type filter = display nothing
        if (matches.length > 1) {
            console.warn(
                `[membershiplinks] Multiple regionalNursesAssociation entries ` +
                `for district "${districtCode}" - displaying nothing per spec`
            );
            return null;
        }

        return {
            title: matches[0].title,
            // Per spec: null url = render as plain text, no link, no icon
            url: matches[0].websiteUrl ?? null,
        };
    } catch (err) {
        console.error("[membershiplinks] Regional fetch failed:", err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY 3 - AFFILIATE ORGANISATIONS
// Single query fetches all affiliate orgs. Three sections are filtered
// client-side from this one response:
//   - stateNursesAssociation  → WSNA Membership Benefits
//   - nationalNursesAssociation → National Nurses Association
//   - nationalUnion            → National Union (union members only)
//
// Confirmed working via Insomnia - all fields available at base entry level.
// No inline fragments needed.
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

interface AffiliateQueryResult {
    entries: AffiliateEntry[];
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

async function fetchAffiliates(
    isUnionMember: boolean
): Promise<AffiliateResults> {
    try {
        const data = await craftQuery<AffiliateQueryResult>(AFFILIATE_QUERY);
        const entries = data.entries ?? [];

        // ── WSNA Membership Benefits ──────────────────────────────────────────
        // Per spec: filter by typeHandle = "stateNursesAssociation"
        // Per spec: multiple entries = display alphabetically
        // No CRM condition - always shown if entry exists in Craft
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
            const nuEntries = entries.filter(
                (e) => e.typeHandle === "nationalUnion"
            );

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

    } catch (err) {
        console.error("[membershiplinks] Affiliate fetch failed:", err);
        return { wsnaBenefits: null, nationalNurses: null, nationalUnion: null };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// POST /api/membershiplinks
//
// Receives MembershipLinksRequest built from the authenticated contact's
// data in UserContext. All three GraphQL query groups fire in parallel via
// Promise.allSettled - one failing does not prevent others from returning.
//
// wsnaBenefits is intentionally absent from the response.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request): Promise<NextResponse> {
    // ── Auth guard ────────────────────────────────────────────────────────────
    try {
        await verifyAuth(req);
    } catch (err) {
        if (err instanceof VerifyAuthError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    try {
        // Guard against empty body - can occur during Next.js dev-mode
        const contentLength = req.headers.get("content-length");
        const contentType = req.headers.get("content-type") ?? "";

        if (
            contentLength === "0" ||
            !contentType.includes("application/json")
        ) {
            return NextResponse.json(
                { error: "Request body is required" },
                { status: 400 }
            );
        }

        // ── Parse and validate request body ──────────────────────────────────────
        const parsed = await parseMembershipLinksRequest(req);
        if (parsed.error) return parsed.error;

        const { facilityCode, districtCode, isUnionMember } = parsed.data;

        // facilityCode and districtCode may be null
        // null means no facility or district assigned in CRM.
        // undefined means the field was missing from the request entirely.
        if (
            facilityCode === undefined ||
            districtCode === undefined ||
            isUnionMember === undefined
        ) {
            return NextResponse.json(
                { error: "Missing required fields in request body" },
                { status: 400 }
            );
        }

        // ── Parallel GraphQL execution ────────────────────────────────────────
        // All three queries fire simultaneously. Promise.allSettled ensures
        // that one query failure does not abort or affect the others.
        // Each individual fetch function also has its own try/catch so
        // allSettled is a second safety net, not the primary error boundary.

        // Validate districtCode format before passing to any query.
        // District codes from Dataverse are short uppercase alphanumeric strings.
        // Reject anything that doesn't match - do not pass unexpected shapes
        // to external systems even via GraphQL variables.
        const safeDistrictCode =
            districtCode !== null && /^[A-Z0-9]{1,10}$/.test(districtCode)
                ? districtCode
                : null;

        if (districtCode !== null && safeDistrictCode === null) {
            console.warn(
                "[membershiplinks] districtCode failed format validation - skipping regional query"
            );
        }

        const [localUnitResult, regionalResult, affiliatesResult] =
            await Promise.allSettled([
                facilityCode !== null
                    ? fetchLocalUnit(facilityCode)
                    : Promise.resolve(null),
                safeDistrictCode !== null
                    ? fetchRegional(safeDistrictCode)
                    : Promise.resolve(null),
                fetchAffiliates(isUnionMember),
            ]);

        const localUnit =
            localUnitResult.status === "fulfilled"
                ? localUnitResult.value
                : null;

        const regional =
            regionalResult.status === "fulfilled"
                ? regionalResult.value
                : null;

        const affiliates =
            affiliatesResult.status === "fulfilled"
                ? affiliatesResult.value
                : { wsnaBenefits: null, nationalNurses: null, nationalUnion: null };

        const response: MembershipLinksResponse = {
            localUnits: localUnit ? [localUnit] : [],
            regional,
            wsnaBenefits: affiliates.wsnaBenefits,
            nationalNurses: affiliates.nationalNurses,
            nationalUnion: affiliates.nationalUnion,
        };;

        return NextResponse.json(response);

    } catch (err) {
        console.error("[membershiplinks] Unexpected error:", err);
        return NextResponse.json(
            { error: "Server error loading membership links" },
            { status: 500 }
        );
    }
}