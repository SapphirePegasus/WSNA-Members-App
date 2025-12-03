import { NextResponse } from "next/server";

const GRAPHQL_URL = process.env.NEXT_PUBLIC_WSNA_API_BASE!;
const TOKEN = process.env.CRAFT_GRAPHQL_TOKEN!;

async function craftQuery(query: string, variables?: any) {
    const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
    });

    return res.json();
}

export async function POST(req: Request) {
    try {
        const { localUnitFormatted, districtCode, isUnionMember } = await req.json();

        let result: any = {
            localUnits: [],
            regional: null,
            wsnaBenefits: null,
            nationalNurses: null,
            nationalUnion: null,
        };

        // ----------------------------------------
        // 1. Local Unit Lookup
        // ----------------------------------------
        if (localUnitFormatted) {
            const localQuery = `
            query($title: [String]) {
                    entries(section: "localUnits", title: $title) {
                    title
                    slug
                }
            }
            `;
            const localResp = await craftQuery(localQuery, {
                title: [localUnitFormatted],
            });

            if (localResp?.data?.entries?.length > 0) {
                result.localUnits = localResp.data.entries.map((e: any) => ({
                    title: e.title,
                    url: `https://www.wsna.org/union/${e.slug}`, // internal link
                }));
            }
        }

        // ----------------------------------------
        // 2. Regional Nurses Association Lookup
        // ----------------------------------------
        function escapeGraphQLString(str: string) {
            return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        }

        if (districtCode) {
            try {
                const safeCode = escapeGraphQLString(String(districtCode));

                const regionalQuery = `
                {
                    entries(section: "affialiateOrgs", regionCode: "${safeCode}") {
                        title
                        regionCode
                        websiteUrl
                        typeHandle
                    }
                }
                `;

                const regResp = await craftQuery(regionalQuery);

                //console.log("REGIONAL QUERY RAW RESPONSE:", regResp);
                //console.log("REGIONAL QUERY RESPONSE ENTRIES:", regResp?.data?.entries);
                if (regResp?.errors) console.error("REGIONAL QUERY ERRORS:", regResp.errors);

                const item = regResp?.data?.entries?.find(
                    (x: any) => x.typeHandle === "regionalNursesAssociation"
                );

                if (item) {
                    result.regional = {
                        title: item.title,
                        url: item.websiteUrl || null,
                    };
                } else {
                    //Can add fallback later if needed
                }
            } catch (err) {
                console.error("Regional lookup error:", err);
            }
        }

        // ----------------------------------------
        // 3. WSNA Membership Benefits (TEMPORARY HARDCODED)
        // ----------------------------------------
        // TODO: Ask WSNA which typeHandle or Craft entry is used for WSNA Member Benefits.

        result.wsnaBenefits = {
            title: "Washington State Nurses Association",
            url: "https://www.wsna.org", // no href until WSNA provides info
        };

        const allAffiliateQuery = `
        {
            entries(section: "affialiateOrgs") {
                title
                websiteUrl
                benefitsPageUrl
                typeHandle
            }
        }
        `;

        const allResp = await craftQuery(allAffiliateQuery);
        const allOrgs = allResp?.data?.entries || [];

        // ----------------------------------------
        // 4. National Nurses Association
        // ----------------------------------------
        const nna = allOrgs.find(
            (x: any) => x.typeHandle === "nationalNursesAssociation"
        );

        if (nna) {
            result.nationalNurses = {
                title: nna.title,
                url: nna.benefitsPageUrl || nna.websiteUrl || null,
            };
        }

        // ----------------------------------------
        // 5. National Union (Union members only)
        // ----------------------------------------
        if (isUnionMember) {
            const nu = allOrgs.find((x: any) => x.typeHandle === "nationalUnion");
            if (nu) {
                result.nationalUnion = {
                    title: nu.title,
                    url: nu.benefitsPageUrl || nu.websiteUrl || null,
                };
            }
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("membershiplinks API error:", err);
        return NextResponse.json(
            { error: "Server error loading membership links" },
            { status: 500 }
        );
    }
}


/*CLEANER CODE USE LATER AFTER CONFIRMATON


import { NextResponse } from "next/server";

const GRAPHQL_URL = process.env.NEXT_PUBLIC_WSNA_API_BASE!;
const TOKEN = process.env.CRAFT_GRAPHQL_TOKEN!;

async function craftQuery(query: string, variables?: any) {
    const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
    });

    return res.json();
}

export async function POST(req: Request) {
    try {
        const { localUnitFormatted, districtCode, isUnionMember } = await req.json();

        let result: any = {
            localUnits: [],
            regional: null,
            wsnaBenefits: null,
            nationalNurses: null,
            nationalUnion: null,
        };

        // ----------------------------------------
        // 1. Local Unit Lookup
        // ----------------------------------------
        if (localUnitFormatted) {
            const localQuery = `
            query($title: [String]) {
                    entries(section: "localUnits", title: $title) {
                    title
                    slug
                }
            }
            `;
            const localResp = await craftQuery(localQuery, {
                title: [localUnitFormatted],
            });

            if (localResp?.data?.entries?.length > 0) {
                result.localUnits = localResp.data.entries.map((e: any) => ({
                    title: e.title,
                    url: `https://www.wsna.org/union/${e.slug}`, // internal link
                }));
            }
        }

        // ----------------------------------------
        // 2. Regional Nurses Association Lookup
        // ----------------------------------------
        function escapeGraphQLString(str: string) {
            return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        }

        if (districtCode) {
            try {
                const safeCode = escapeGraphQLString(String(districtCode));

                const regionalQuery = `
                {
                    entries(section: "affialiateOrgs", regionCode: "${safeCode}") {
                        title
                        regionCode
                        websiteUrl
                        typeHandle
                    }
                }
                `;

                const regResp = await craftQuery(regionalQuery);

                //console.log("REGIONAL QUERY RAW RESPONSE:", regResp);
                //console.log("REGIONAL QUERY RESPONSE ENTRIES:", regResp?.data?.entries);
                if (regResp?.errors) console.error("REGIONAL QUERY ERRORS:", regResp.errors);

                const item = regResp?.data?.entries?.find(
                    (x: any) => x.typeHandle === "regionalNursesAssociation"
                );

                if (item) {
                    result.regional = {
                        title: item.title,
                        url: item.websiteUrl || null,
                    };
                } else {
                    //Can add fallback later if needed
                }
            } catch (err) {
                console.error("Regional lookup error:", err);
            }
        }

        // ----------------------------------------
        // 3 / 4 / 5: All affiliate orgs handling (consolidated)
        // ----------------------------------------
        // TODO: Ask WSNA which typeHandle or Craft entry is used for WSNA Member Benefits.

        const allAffiliateQuery = `
        {
            entries(section: "affialiateOrgs") {
                title
                websiteUrl
                benefitsPageUrl
                typeHandle
            }
        }
        `;

        const allResp = await craftQuery(allAffiliateQuery);
        const allOrgs = allResp?.data?.entries || [];

        // helper to find affiliate by typeHandle
        function findByHandle(handle: string) {
            return allOrgs.find((x: any) => x.typeHandle === handle) || null;
        }

        // Try to locate WSNA benefits in the dataset first, otherwise fallback to placeholder
        const wsnaFromCraft =
            allOrgs.find(
                (x: any) =>
                    x.title &&
                    x.title.toLowerCase().includes("washington state nurses association")
            ) || null;

        if (wsnaFromCraft) {
            result.wsnaBenefits = {
                title: wsnaFromCraft.title,
                url: wsnaFromCraft.benefitsPageUrl || wsnaFromCraft.websiteUrl || null,
            };
        } else {
            // Temporary placeholder until WSNA provides the correct Craft entry/typeHandle
            result.wsnaBenefits = {
                title: "Washington State Nurses Association",
                url: "https://www.wsna.org", // placeholder (no detailed benefits URL yet)
            };
        }

        // National Nurses Association
        const nna = findByHandle("nationalNursesAssociation");
        if (nna) {
            result.nationalNurses = {
                title: nna.title,
                url: nna.benefitsPageUrl || nna.websiteUrl || null,
            };
        }

        // National Union (Union members only)
        if (isUnionMember) {
            const nu = findByHandle("nationalUnion");
            if (nu) {
                result.nationalUnion = {
                    title: nu.title,
                    url: nu.benefitsPageUrl || nu.websiteUrl || null,
                };
            }
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("membershiplinks API error:", err);
        return NextResponse.json(
            { error: "Server error loading membership links" },
            { status: 500 }
        );
    }
}



 */