import type { NextRequest, NextResponse } from "next/server";
import { normaliseFileKind } from "@/app/lib/fileIconMap";
import type { RawTopicEntry, ResourcesApiResponse } from "@/app/types/resources";
import { validateSectionParam } from "@/app/lib/validate";
import { authorizeMember } from "@/app/lib/authorizeMember";
import { craftQuery, extractEntries } from "@/app/lib/craftClient";
import { UpstreamUnavailableError } from "@/app/lib/upstream";
import {
  deniedResponse,
  errorResponse,
  jsonNoStore,
  upstreamUnavailableResponse,
} from "@/app/lib/apiResponse";
import { logSafeError } from "@/app/lib/safeLog";

// ─────────────────────────────────────────────────────────────────────────────
// GRAPHQL QUERY
// Fetches all entries in a given section ordered by Craft's lft (left) value,
// which preserves the structure order defined in the CMS.
// The $section variable is injected at runtime from the query-string param,
// which validateSectionParam has already restricted to released handles.
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
// FETCH + NORMALISE
// Transport, caching and timeouts live in craftClient. Cached responses are
// shared by reference, so the mapping below builds NEW objects and never
// mutates the entries it receives.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchResourceTopics(section: string): Promise<RawTopicEntry[]> {
  const data = await craftQuery(
    RESOURCES_QUERY,
    { section: [section] },
    `resources:${section}` // `section` is allowlisted, so this key space is tiny
  );

  const rawEntries = extractEntries(data);

  // ───────────────────────────────────────────────────────────────────────────
  // NORMALISATION
  // This is the only place in the codebase where raw GraphQL data is touched.
  // We coerce `kind` from a plain string to a FileKind here so every consumer
  // downstream works with typed, validated data - never raw wire format.
  // Null-coerce subtitle so components never receive undefined.
  // ───────────────────────────────────────────────────────────────────────────
  return rawEntries.map((entry) => {
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
//   403 - authenticated but not an eligible member (AUTH-02)
//   429 - per-identity rate limit exceeded (Retry-After)
//   500 - unexpected server error
//   503 - Craft CMS unavailable (Retry-After)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authorizeMember(request, "resources");
    if (auth.kind === "rejected") return auth.response;
    if (auth.kind === "denied") return deniedResponse(auth.reason);

    const section = request.nextUrl.searchParams.get("section")?.trim();

    const sectionResult = validateSectionParam(section);
    if (sectionResult.error) return sectionResult.error;

    const topics = await fetchResourceTopics(sectionResult.data);
    const body: ResourcesApiResponse = { topics };

    return auth.applyProof(jsonNoStore(body));
  } catch (err) {
    if (err instanceof UpstreamUnavailableError) {
      return upstreamUnavailableResponse(err);
    }

    logSafeError("api/resources", err);
    return errorResponse(
      "Failed to load resources. Please try again later.",
      500
    );
  }
}