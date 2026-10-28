import { getCraftToken, getWsnaApiBase } from "@/app/lib/env";
import { LIMITS } from "@/config/limits";
import { TtlCache } from "@/app/lib/ttlCache";
import { logEvent } from "@/app/lib/safeLog";
import {
    UpstreamUnavailableError,
    DEFAULT_RETRY_AFTER_SECONDS,
    fetchWithTimeout,
    readJson,
    retryAfterSeconds,
} from "@/app/lib/upstream";

// ─────────────────────────────────────────────────────────────────────────────
// CRAFT CMS CLIENT
// The only place the server talks to Craft's GraphQL API. Craft backs the
// PUBLIC website, so this client shields it:
//   cache (5 min, single-flight) -> most requests never reach Craft
//     -> timeout                 -> a slow Craft cannot pin instances
// Cached values are shared by reference between requests: treat as READ-ONLY.
// ─────────────────────────────────────────────────────────────────────────────

const cache = new TtlCache<unknown>({
    maxEntries: LIMITS.craft.cacheMaxEntries,
    ttlMs: LIMITS.craft.cacheTtlMs,
});

async function requestCraft(
    query: string,
    variables: Record<string, unknown> | undefined
): Promise<unknown> {
    const startedAt = performance.now();
    const durationMs = () => Math.round(performance.now() - startedAt);

    const res = await fetchWithTimeout(
        getWsnaApiBase(),
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getCraftToken()}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, variables }),
        },
        LIMITS.upstream.timeoutMs
    );

    // 429 / 5xx: Craft (or the CDN in front of it) cannot serve us right now.
    if (res.status === 429 || res.status >= 500) {
        logEvent("craft.request", {
            outcome: res.status === 429 ? "throttled" : "server_error",
            status: res.status,
            durationMs: durationMs(),
        });
        const wait = retryAfterSeconds(res.headers.get("Retry-After"));
        await res.body?.cancel().catch(() => undefined); // free the connection
        throw new UpstreamUnavailableError(
            res.status === 429 ? "throttled" : "upstream-error",
            wait
        );
    }

    // Other non-2xx (e.g. 401/403 from a bad token) is a configuration fault.
    if (!res.ok) {
        logEvent("craft.request", {
            outcome: "client_error",
            status: res.status,
            durationMs: durationMs(),
        });
        await res.body?.cancel().catch(() => undefined);
        throw new Error(`Craft CMS GraphQL request failed: ${res.status}`);
    }

    const json = await readJson(res);
    logEvent("craft.request", {
        outcome: "ok",
        status: res.status,
        durationMs: durationMs(),
    });

    if (typeof json !== "object" || json === null) {
        throw new UpstreamUnavailableError("upstream-error", DEFAULT_RETRY_AFTER_SECONDS);
    }

    const body = json as { data?: unknown; errors?: unknown };

    // GraphQL can return HTTP 200 with errors in the body - check explicitly.
    // Messages are sanitised by logSafeError before they reach the logs.
    if (Array.isArray(body.errors) && body.errors.length > 0) {
        const messages = body.errors
            .map((e) =>
                typeof (e as { message?: unknown })?.message === "string"
                    ? (e as { message: string }).message
                    : "unknown error"
            )
            .join("; ");
        throw new Error(`Craft CMS GraphQL errors: ${messages}`);
    }

    return body.data;
}

// `cacheKey` must uniquely identify (query + variables).
export function craftQuery(
    query: string,
    variables: Record<string, unknown> | undefined,
    cacheKey: string
): Promise<unknown> {
    return cache.getOrLoad(cacheKey, () => requestCraft(query, variables));
}

// Validates the one shape every query in this app returns: { entries: [...] }.
// A missing/null `entries` is an empty result; any other non-array is a
// malformed upstream response, never silently treated as "no content".
export function extractEntries(data: unknown): Record<string, unknown>[] {
    const entries =
        typeof data === "object" && data !== null
            ? (data as { entries?: unknown }).entries
            : undefined;

    if (entries === undefined || entries === null) return [];

    if (
        !Array.isArray(entries) ||
        !entries.every((entry) => typeof entry === "object" && entry !== null)
    ) {
        throw new UpstreamUnavailableError("upstream-error", DEFAULT_RETRY_AFTER_SECONDS);
    }

    return entries as Record<string, unknown>[];
}