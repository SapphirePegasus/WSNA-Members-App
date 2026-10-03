import { NextRequest, NextResponse } from "next/server";
import { normaliseFileKind } from "@/app/lib/fileIconMap";
import type { RawTopicEntry, ResourcesApiResponse } from "@/app/types/resources";
import { verifyAuth, VerifyAuthError } from "@/app/lib/verifyAuth";
import { validateSectionParam } from "@/app/lib/validate";
import { getCraftToken, getWsnaApiBase } from "@/app/lib/env";

//const GRAPHQL_URL = process.env.NEXT_PUBLIC_WSNA_API_BASE!;
//const TOKEN = process.env.CRAFT_GRAPHQL_TOKEN!;

// Server-side only: how long Next.js may reuse the Craft GraphQL response in
// its own Data Cache. This is NOT sent to clients. Responses from this route
// are never cacheable by browsers, CDNs or shared proxies (CACHE-01).
const CRAFT_REVALIDATE_SECONDS = 300;

// CACHE-01: protected responses - success and error - are private and
// non-storable. Also enforced in next.config.ts and proxy.ts; set here so this
// endpoint does not depend on those layers alone.
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

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
    // Next.js Data Cache - revalidates server-side every
    // CRAFT_REVALIDATE_SECONDS. Unrelated to the Cache-Control header sent
    // to clients, which is always private, no-store.
    next: { revalidate: CRAFT_REVALIDATE_SECONDS },
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
//   section (required) - a released Craft CMS section handle (API-01).
//
// Responses (all carry Cache-Control: private, no-store - CACHE-01):
//   200 - ResourcesApiResponse JSON
//   400 - missing or invalid/unreleased section param
//   401 - missing or invalid credential
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

  const sectionResult = validateSectionParam(section);
  if (sectionResult.error) return sectionResult.error;

  const validatedSection = sectionResult.data;

  try {
    const topics = await fetchResourceTopics(validatedSection);

    const body: ResourcesApiResponse = { topics };

    return NextResponse.json(body, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    console.error("[resources/route] Failed to fetch resource topics:", error);

    return NextResponse.json(
      { error: "Failed to load resources. Please try again later." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}