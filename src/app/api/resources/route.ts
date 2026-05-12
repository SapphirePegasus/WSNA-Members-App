// CHECK LINE 151 LATER

import { NextRequest, NextResponse } from "next/server";
import { normaliseFileKind } from "@/app/lib/fileIconMap";
import type { RawTopicEntry, ResourcesApiResponse } from "@/app/types/resources";
import { verifyAuth, VerifyAuthError } from "@/app/lib/verifyAuth";
import { validateSectionParam } from "@/app/lib/validate";
import { getCraftToken, getWsnaApiBase } from "@/app/lib/env";

//const GRAPHQL_URL = process.env.NEXT_PUBLIC_WSNA_API_BASE!;
//const TOKEN = process.env.CRAFT_GRAPHQL_TOKEN!;

// The browser and CDN may cache this response for 5 minutes.
const CACHE_MAX_AGE_SECONDS = 300;

// ─────────────────────────────────────────────────────────────────────────────
// GRAPHQL QUERY
// Fetches all entries in a given section ordered by Craft's lft (left) value,
// which preserves the structure order defined in the CMS.
// The $section variable is injected at runtime from the query-string param.
// ─────────────────────────────────────────────────────────────────────────────
const RESOURCES_QUERY = `
  query ResourceTopics($section: [String]) {
    entries(section: $section, orderBy: "lft ASC") {
      id
      title
      slug
      level
      lft
      rgt
      parent {
        id
      }
      ... on appResourceTopic_Entry {
        description
        files: appResourceFiles {
          id
          title
          url
          size
          kind
          ... on entryAssets_Asset {
            subtitle
          }
        }
      }
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// GRAPHQL FETCHER
// Thin wrapper around fetch - keeps the route handler readable.
// Throws on non-2xx so the caller can catch and return a 500.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchResourceTopics(section: string): Promise<RawTopicEntry[]> {
  const response = await fetch(getWsnaApiBase(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getCraftToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: RESOURCES_QUERY,
      variables: { section: [section] },
    }),
    // Next.js fetch cache - revalidates server-side every CACHE_MAX_AGE_SECONDS.
    // This is separate from the HTTP Cache-Control header sent to the client.
    next: { revalidate: CACHE_MAX_AGE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(
      `Craft CMS GraphQL request failed: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (json.errors?.length) {
    // GraphQL can return HTTP 200 with errors in the body - check explicitly.
    const messages = json.errors
      .map((e: { message: string }) => e.message)
      .join("; ");
    throw new Error(`Craft CMS GraphQL errors: ${messages}`);
  }

  const rawEntries: unknown[] = json.data?.entries ?? [];

  // ───────────────────────────────────────────────────────────────────────────
  // NORMALISATION
  // This is the only place in the codebase where raw GraphQL data is touched.
  // We coerce `kind` from a plain string to a FileKind here so every consumer
  // downstream works with typed, validated data - never raw wire format.
  // Null-coerce subtitle so components never receive undefined.
  // ───────────────────────────────────────────────────────────────────────────
  return (rawEntries as Record<string, unknown>[]).map((entry) => {
    const rawFiles = (entry.files as Record<string, unknown>[] | undefined) ?? [];

    return {
      id: entry.id as string,
      title: entry.title as string,
      slug: entry.slug as string,
      level: entry.level as number,
      lft: entry.lft as number,
      rgt: entry.rgt as number,
      parent: entry.parent as { id: string } | null,
      description: (entry.description as string | null) ?? null,
      files: rawFiles.map((file) => ({
        id: file.id as string,
        title: file.title as string,
        subtitle: (file.subtitle as string | null) ?? null,
        url: file.url as string,
        size: file.size as number,
        kind: normaliseFileKind(file.kind as string),
      })),
    } satisfies RawTopicEntry;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// GET /api/resources?section=appResourceTopics_Growth
//
// Query params:
//   section (required) - the Craft CMS section handle to query.
//
// Responses:
//   200 - ResourcesApiResponse JSON with cache headers
//   400 - missing or invalid section param
//   500 - upstream Craft CMS error
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  // ── Auth guard ────────────────────────────────────────────────────────────
  try {
    await verifyAuth(request);
  } catch (err) {
    if (err instanceof VerifyAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const section = searchParams.get("section")?.trim();

  // Validate the section param - never send an empty string to Craft CMS.
  /*if (!section) {
    return NextResponse.json(
      { error: "Missing required query parameter: section" },
      { status: 400 }
    );
  }

  // Sanity-check the section format to prevent arbitrary string injection
  // into the GraphQL variables. Craft section handles are alphanumeric + underscore only.
  const VALID_SECTION_PATTERN = /^[a-zA-Z0-9_]+$/;
  if (!VALID_SECTION_PATTERN.test(section)) {
    return NextResponse.json(
      { error: "Invalid section parameter format" },
      { status: 400 }
    );
  }*/

  const sectionResult = validateSectionParam(section);
  if (sectionResult.error) return sectionResult.error;

  const validatedSection = sectionResult.data;

  try {
    const topics = await fetchResourceTopics(validatedSection);

    const body: ResourcesApiResponse = { topics };

    return NextResponse.json(body, {
      status: 200,
      headers: {
        // Instruct the browser to treat this as fresh for CACHE_MAX_AGE_SECONDS,
        // then serve stale while revalidating in the background (stale-while-revalidate).
        // This means users almost never wait for a network round-trip on repeat visits.
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_MAX_AGE_SECONDS * 2}`,
      },
    });
  } catch (error) {
    console.error("[resources/route] Failed to fetch resource topics:", error);

    return NextResponse.json(
      { error: "Failed to load resources. Please try again later." },
      { status: 500 }
    );
  }
}