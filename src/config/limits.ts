// ─────────────────────────────────────────────────────────────────────────────
// LIMITS - single source of truth for every tunable in the API protection
// layer. Engineering defaults sized for ~15-20k members; tune from production
// logs. Limiter state is per server instance (best-effort on serverless).
// ─────────────────────────────────────────────────────────────────────────────
export const LIMITS = {
    // Per client IP, enforced in proxy.ts BEFORE authentication. Deliberately
    // generous: many members share one office NAT address. A flood guard, not
    // a fair-use limiter.
    ip: {
        apiPerMinute: 1_500,
        contactPerMinute: 300,
    },

    // Per verified identity (normalised email), enforced AFTER authentication.
    // Normal use is ~1 call per app launch, far below these.
    identity: {
        contactPerMinute: 10,
        resourcesPerMinute: 20,
        membershipLinksPerMinute: 10,
    },

    // Hard deadline for every outbound call (Dataverse, Craft, token endpoint).
    upstream: {
        timeoutMs: 8_000,
    },

    // Craft CMS backs the public website; protect it. One shared cache.
    craft: {
        cacheTtlMs: 300_000,
        cacheMaxEntries: 200,
    },

    // Eligibility proof cookie lifetime. Also the maximum revocation lag for
    // the Craft-backed routes (public links and files only).
    proof: {
        ttlSeconds: 900,
    },

    // Hard cap on tracked keys per rate limiter (memory safety).
    rateLimiter: {
        maxKeys: 20_000,
    },
} as const;