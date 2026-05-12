import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Edge middleware a.k.a proxy - runs before every matched request.
// Responsibilities:
//   1. Rate limiting on API routes
//
// MSAL note: MSAL authentication is handled client-side via AuthGuard
// components and server-side via verifyAuth in individual API routes.
// Do not add MSAL token verification here - the edge runtime does not
// have access to the full Node.js crypto APIs that jose requires in all
// environments. Auth belongs in the route handlers.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITER
// Sliding window counter - per IP, per route group, per region.
// No external dependencies - uses a module-level Map on the edge runtime.
//
// Limits are intentionally conservative for a member portal:
//   /api/contact        - 10 req/min  (login flow, should be infrequent)
//   /api/membershiplinks - 30 req/min  (card loads, tab switches)
//   /api/resources      - 60 req/min  (resource tabs, cached client-side)
//   all other /api/*    - 30 req/min  (catch-all for any future routes)
//
// Window: 60 seconds sliding
// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

// Module-level - persists across requests within the same edge runtime instance
const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 60 seconds

const LIMITS: Record<string, number> = {
    "/api/contact": 10,
    "/api/membershiplinks": 30,
    "/api/resources": 60,
};

const DEFAULT_LIMIT = 30;

// Cleanup entries older than 2 windows to prevent unbounded memory growth.
// Called on every request - not expensive because Map iteration is O(n) and the
// store will be small (one entry per active IP per route).
function pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (now - entry.windowStart > WINDOW_MS * 2) {
            rateLimitStore.delete(key);
        }
    }
}

function getClientIp(req: NextRequest): string {
    // Vercel sets x-forwarded-for reliably - first IP is the real client
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    // Fallback - should not occur on Vercel but defensive
    return req.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(
    ip: string,
    pathname: string
): { allowed: boolean; remaining: number; resetInMs: number } {
    pruneExpired();

    // Match the most specific route first, then fall back to default
    const limit =
        LIMITS[pathname] ??
        (pathname.startsWith("/api/") ? DEFAULT_LIMIT : null);

    // Not an API route - no limit applies
    if (limit === null) {
        return { allowed: true, remaining: Infinity, resetInMs: 0 };
    }

    const now = Date.now();
    const key = `${ip}:${pathname}`;
    const entry = rateLimitStore.get(key);

    // No existing entry or window has expired - start a new window
    if (!entry || now - entry.windowStart >= WINDOW_MS) {
        rateLimitStore.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: limit - 1, resetInMs: WINDOW_MS };
    }

    // Within existing window
    if (entry.count >= limit) {
        const resetInMs = WINDOW_MS - (now - entry.windowStart);
        return { allowed: false, remaining: 0, resetInMs };
    }

    entry.count += 1;
    return {
        allowed: true,
        remaining: limit - entry.count,
        resetInMs: WINDOW_MS - (now - entry.windowStart),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE (PROXY) HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export function proxy(req: NextRequest): NextResponse {
    const { pathname } = req.nextUrl;

    // Only rate limit API routes
    if (!pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    const ip = getClientIp(req);
    const { allowed, remaining, resetInMs } = checkRateLimit(ip, pathname);

    if (!allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again shortly." },
            {
                status: 429,
                headers: {
                    "Retry-After": String(Math.ceil(resetInMs / 1000)),
                    "X-RateLimit-Limit": String(LIMITS[pathname] ?? DEFAULT_LIMIT),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": String(
                        Math.ceil((Date.now() + resetInMs) / 1000)
                    ),
                },
            }
        );
    }

    // Pass through with rate limit headers so clients can self-throttle
    const response = NextResponse.next();
    response.headers.set(
        "X-RateLimit-Limit",
        String(LIMITS[pathname] ?? DEFAULT_LIMIT)
    );
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set(
        "X-RateLimit-Reset",
        String(Math.ceil((Date.now() + resetInMs) / 1000))
    );

    return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHER
// Tells Next.js which paths this middleware runs on.
// Explicitly excludes static assets and Next.js internals for performance.
// ─────────────────────────────────────────────────────────────────────────────
export const proxyConfig = {
    matcher: [
        "/api/:path*",
    ],
};