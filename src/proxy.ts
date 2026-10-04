import { NextRequest, NextResponse } from "next/server";
import { LIMITS } from "@/config/limits";
import { createPerMinuteLimiter } from "@/app/lib/rateLimit";
import { logEvent } from "@/app/lib/safeLog";

// ─────────────────────────────────────────────────────────────────────────────
// Next.js 16 proxy (formerly middleware) - runs before every matched request.
//   1. A per-client-IP FLOOD GUARD on API routes (coarse and generous).
//   2. Cache-Control: private, no-store on API responses (CACHE-01).
//
// NOT the fair-use limiter: many members share one office NAT address, so IP
// limits must stay generous. Fair-use limiting is per verified identity, after
// authentication, in authorizeMember. Authentication stays in the route
// handlers - do not add token verification here.
//
// Limiter state is per server instance (best-effort on serverless).
//
// Client IP comes from x-forwarded-for, which the hosting platform sets
// (Vercel restricts these headers to prevent spoofing). If a CDN or reverse
// proxy is ever placed IN FRONT of the platform, that header may be
// overwritten and clientKey() must be revisited.
// ─────────────────────────────────────────────────────────────────────────────

// CACHE-01: mirrors next.config.ts and the route handlers.
const NO_STORE = "private, no-store";

const CONTACT_PATH = "/api/contact";
const UNKNOWN_CLIENT = "unknown";

// Characters and length of any IPv4 / IPv6 text. Anything else (garbage or a
// spoof attempt) shares ONE "unknown" bucket instead of minting new keys.
const CLIENT_KEY_PATTERN = /^[0-9a-fA-F:.]{2,45}$/;

const apiLimiter = createPerMinuteLimiter(
    LIMITS.ip.apiPerMinute,
    LIMITS.rateLimiter.maxKeys
);
const contactLimiter = createPerMinuteLimiter(
    LIMITS.ip.contactPerMinute,
    LIMITS.rateLimiter.maxKeys
);

function clientKey(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const candidate = (
        forwarded ? forwarded.split(",")[0] : (req.headers.get("x-real-ip") ?? "")
    ).trim();

    return CLIENT_KEY_PATTERN.test(candidate)
        ? candidate.toLowerCase()
        : UNKNOWN_CLIENT;
}

// A flood can produce thousands of rejections a minute. Logging each would
// turn an attack into a log-volume problem, so log at most once per interval.
const LOG_INTERVAL_MS = 10_000;
let lastRejectionLoggedAt = Number.NEGATIVE_INFINITY;

function tooManyRequests(
    scope: "api" | "contact",
    retryAfterSeconds: number
): NextResponse {
    const now = performance.now();
    if (now - lastRejectionLoggedAt >= LOG_INTERVAL_MS) {
        lastRejectionLoggedAt = now;
        logEvent("ip.rate_limited", { scope });
    }

    return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
            status: 429,
            headers: {
                "Cache-Control": NO_STORE,
                "Retry-After": String(retryAfterSeconds),
            },
        }
    );
}

export function proxy(req: NextRequest): NextResponse {
    const { pathname } = req.nextUrl;

    // Defensive: the matcher already restricts this to /api/*.
    if (!pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    const key = clientKey(req);

    // The route-specific cap is checked first so a throttled /api/contact
    // flood does not also drain the shared /api budget for everyone else
    // behind the same address.
    if (pathname.replace(/\/+$/, "") === CONTACT_PATH) {
        const decision = contactLimiter.consume(key);
        if (!decision.allowed) {
            return tooManyRequests("contact", decision.retryAfterSeconds);
        }
    }

    const decision = apiLimiter.consume(key);
    if (!decision.allowed) {
        return tooManyRequests("api", decision.retryAfterSeconds);
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", NO_STORE);
    return response;
}

// Only API routes are guarded; pages and static assets never pass through.
export const config = {
    matcher: ["/api/:path*"],
};