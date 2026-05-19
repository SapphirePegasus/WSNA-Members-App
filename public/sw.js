/**
 * WSNA Member Portal — Service Worker
 *
 * Strategy per resource type:
 *   Static assets (JS, CSS, fonts, images) — CacheFirst
 *   Pages (HTML navigation)                — NetworkFirst with offline fallback
 *   API routes                             — NetworkOnly (user-specific, never cache)
 *   /api/resources                         — NetworkFirst with short TTL (semi-public CMS data)
 */

// ─────────────────────────────────────────────────────────────────────────────
// CACHE VERSIONING
// BUILD_TIMESTAMP is injected at deploy time via next.config.ts headers
// or falls back to a hardcoded version during local testing.
// Bump CACHE_VERSION manually only when you want to force-invalidate
// ALL caches across all users simultaneously (breaking change).
// Normal deployments are handled automatically by Next.js content hashing
// on static assets — those cache entries self-invalidate on URL change.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_VERSION = "v1";
const BUILD_TIMESTAMP = self.__BUILD_TIMESTAMP__ || CACHE_VERSION;
const STATIC_CACHE = `wsna-static-${BUILD_TIMESTAMP}`;
const PAGE_CACHE = `wsna-pages-${BUILD_TIMESTAMP}`;
const FONT_CACHE = `wsna-fonts-${BUILD_TIMESTAMP}`;

const OFFLINE_PAGE = "/offline";

const PRECACHE_ASSETS = [
    "/offline",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/icons/apple-touch-icon.png",
    "/background.svg",
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function isNavigationRequest(request) {
    return request.mode === "navigate";
}

function isStaticAsset(url) {
    return (
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname.endsWith(".ico") ||
        url.pathname.endsWith(".svg") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".webp")
    );
}

function isFont(url) {
    return (
        url.pathname.startsWith("/_next/static/media/") ||
        url.pathname.endsWith(".woff2") ||
        url.pathname.endsWith(".woff")
    );
}

function isApiRequest(url) {
    return url.pathname.startsWith("/api/");
}

function isResourcesApi(url) {
    return url.pathname === "/api/resources";
}

function isCrossOrigin(url) {
    return url.origin !== self.location.origin;
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL — precache critical assets
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE — clean up old caches
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
    const validCaches = [STATIC_CACHE, PAGE_CACHE, FONT_CACHE];

    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => !validCaches.includes(key))
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH — route requests to appropriate strategy
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Never intercept cross-origin requests (MSAL, Dataverse, Craft CMS)
    if (isCrossOrigin(url)) return;

    // Never intercept non-GET requests
    if (event.request.method !== "GET") return;

    // /api/resources — NetworkFirst, short TTL, semi-public CMS data
    if (isResourcesApi(url)) {
        event.respondWith(networkFirstWithTTL(event.request, STATIC_CACHE, 300));
        return;
    }

    // All other API routes — NetworkOnly, never cache user-specific data
    if (isApiRequest(url)) {
        event.respondWith(networkOnly(event.request));
        return;
    }

    // Fonts — CacheFirst, long lived, never change
    if (isFont(url)) {
        event.respondWith(cacheFirst(event.request, FONT_CACHE));
        return;
    }

    // Static assets — CacheFirst, content-hashed by Next.js so safe
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(event.request, STATIC_CACHE));
        return;
    }

    // Page navigations — NetworkFirst with offline fallback
    if (isNavigationRequest(event.request)) {
        event.respondWith(networkFirstWithOfflineFallback(event.request));
        return;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CacheFirst
 * Serve from cache if available. Fetch and cache on miss.
 * Use for: static assets, fonts — anything content-hashed or immutable.
 */
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response("Asset unavailable offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
        });
    }
}

/**
 * NetworkFirst with offline fallback
 * Try network, fall back to cache, fall back to offline page.
 * Use for: HTML page navigations.
 */
async function networkFirstWithOfflineFallback(request) {
    const cache = await caches.open(PAGE_CACHE);

    try {
        const response = await fetch(request);

        if (response.ok) {
            cache.put(request, response.clone());
        }

        return response;
    } catch {
        const cached = await cache.match(request);
        if (cached) return cached;

        // Serve the precached offline page as last resort
        const offline = await caches.match(OFFLINE_PAGE);
        return (
            offline ||
            new Response("You are offline", {
                status: 503,
                headers: { "Content-Type": "text/plain" },
            })
        );
    }
}

/**
 * NetworkFirst with TTL
 * Serve network response and cache it. If network fails, serve cache
 * only if the cached response is within the TTL (seconds).
 * Use for: /api/resources — semi-public CMS data with server-side revalidation.
 */
async function networkFirstWithTTL(request, cacheName, ttlSeconds) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);

        if (response.ok) {
            const responseWithTimestamp = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                    ...Object.fromEntries(response.headers.entries()),
                    "sw-cached-at": Date.now().toString(),
                },
            });
            cache.put(request, responseWithTimestamp);
            return responseWithTimestamp;
        }

        return response;
    } catch {
        const cached = await cache.match(request);

        if (cached) {
            const cachedAt = cached.headers.get("sw-cached-at");
            const age = cachedAt
                ? (Date.now() - parseInt(cachedAt, 10)) / 1000
                : Infinity;

            if (age <= ttlSeconds) return cached;
        }

        return new Response(
            JSON.stringify({ error: "Resource unavailable offline" }),
            {
                status: 503,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

/**
 * NetworkOnly
 * Always fetch from network. Never cache.
 * Use for: authenticated API routes with user-specific data.
 */
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch {
        return new Response(
            JSON.stringify({ error: "You are offline" }),
            {
                status: 503,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handle skip waiting and build timestamp injection
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting();
    }

    if (event.data?.type === "SET_BUILD_TIMESTAMP") {
        self.__BUILD_TIMESTAMP__ = event.data.timestamp;
    }
});