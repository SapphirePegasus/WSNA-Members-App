

import { NextResponse } from "next/server";
import type {
    MembershipLinksRequest,
    MembershipLinksResponse,
    MembershipLink,
} from "@/app/types/membership";


const GRAPHQL_URL = process.env.NEXT_PUBLIC_WSNA_API_BASE!;
const TOKEN = process.env.CRAFT_GRAPHQL_TOKEN!;


async function craftQuery<T>(
    query: string,
    variables?: Record<string, unknown>
): Promise<T> {
    const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${TOKEN}`,
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
        // Isolated failure — does not affect other link sections
        console.error("[membershiplinks] Local unit fetch failed:", err);
        return null;
    }
}


function buildRegionalQuery(districtCode: string): string {
    const safeCode = districtCode
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');

    return `
        {
            entries(section: "affialiateOrgs", regionCode: "${safeCode}") {
                title
                websiteUrl
                typeHandle
            }
        }
    `;
}

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
            buildRegionalQuery(districtCode)
        );

        const matches = data.entries?.filter(
            (e) => e.typeHandle === "regionalNursesAssociation"
        );

        if (!matches || matches.length === 0) return null;

        if (matches.length > 1) {
            console.warn(
                `[membershiplinks] Multiple regionalNursesAssociation entries ` +
                `for district "${districtCode}" — displaying nothing per spec`
            );
            return null;
        }

        return {
            title: matches[0].title,
            url: matches[0].websiteUrl ?? null,
        };
    } catch (err) {
        console.error("[membershiplinks] Regional fetch failed:", err);
        return null;
    }
}

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
        let nationalUnion: MembershipLink | null = null;

        if (isUnionMember) {
            const nuEntries = entries.filter(
                (e) => e.typeHandle === "nationalUnion"
            );

            if (nuEntries.length > 1) {
                console.warn(
                    "[membershiplinks] Multiple nationalUnion entries found — " +
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

export async function POST(req: Request): Promise<NextResponse> {
    try {
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

        // Parse body — safe after the guard above
        let body: MembershipLinksRequest;
        try {
            body = (await req.json()) as MembershipLinksRequest;
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { facilityCode, districtCode, isUnionMember } = body;

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

        const [localUnitResult, regionalResult, affiliatesResult] =
            await Promise.allSettled([
                facilityCode !== null
                    ? fetchLocalUnit(facilityCode)
                    : Promise.resolve(null),
                districtCode !== null
                    ? fetchRegional(districtCode)
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