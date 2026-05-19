/**
 * WSNA Member Portal — Service Worker
 *
 * Caching strategy by resource type:
 *
 *   Static assets (/_next/static/**)  — CacheFirst
 *     Rationale: Next.js content-hashes all filenames. A changed file
 *     gets a new URL, so stale cache entries are never served.
 *
 *   Fonts (*.woff2, *.woff)           — CacheFirst, separate long-lived bucket
 *     Rationale: Font files are immutable once deployed.
 *
 *   Page navigations (mode=navigate)  — NetworkFirst with offline fallback
 *     Rationale: Always serve fresh HTML shell. Fall back to cached shell
 *     when offline. App is client-rendered so the shell contains no
 *     user-specific data.
 *
 *   ALL /api/* routes                 — NetworkOnly, NEVER cache
 *     Rationale: Every API route requires a Bearer token. The SW cache
 *     key is URL only — headers (including Authorization) are not part
 *     of the key. Caching any authenticated response risks serving one
 *     user's data to another (shared device) or serving stale auth
 *     rejections. The server already sets Cache-Control headers on
 *     /api/resources; the browser HTTP cache handles revalidation
 *     correctly without SW involvement.
 *
 *   Everything else                   — Pass through (no interception)
 *
 * CONSTRAINT: Never add SW-level caching for any route that requires
 * an Authorization header. Use server-side Cache-Control and Next.js
 * fetch revalidation instead.
 *
 * CACHE VERSIONING:
 *   Bump CACHE_VERSION when you need to force-invalidate all user caches
 *   simultaneously (e.g. after a breaking structural change). For normal
 *   deploys, Next.js content hashing handles static asset invalidation
 *   automatically via URL changes.
 *
 *   BUILD_TIMESTAMP is injected at build time by the build script
 *   (scripts/inject-sw-timestamp.mjs). Do not set it manually.
 *   If the placeholder is not replaced (local dev without running the
 *   script), it falls back to CACHE_VERSION so the SW still functions.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CACHE NAMES
// Each logical asset type gets its own bucket so they can be versioned
// and purged independently without affecting other asset types.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = "v2"; // REMEMBER TO BUMP THIS VERSION IF THIS FILE IS CHANGED
const BUILD_TIMESTAMP = "__BUILD_TIMESTAMP__";
const RESOLVED_VERSION =
    BUILD_TIMESTAMP === "__BUILD_TIMESTAMP__" ? CACHE_VERSION : BUILD_TIMESTAMP;

const STATIC_CACHE = `wsna-static-${RESOLVED_VERSION}`;
const PAGE_CACHE = `wsna-pages-${RESOLVED_VERSION}`;
const FONT_CACHE = `wsna-fonts-${RESOLVED_VERSION}`;

const ALL_CACHES = [STATIC_CACHE, PAGE_CACHE, FONT_CACHE];

// ─────────────────────────────────────────────────────────────────────────────
// PRECACHE MANIFEST
// Only cache assets that are safe to serve offline without authentication.
// Never include API routes or authenticated page URLs here.
// ─────────────────────────────────────────────────────────────────────────────

const OFFLINE_PAGE = "/offline";

const PRECACHE_ASSETS = [
    OFFLINE_PAGE,
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/icons/apple-touch-icon.png",
    "/background.svg",
];

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL
// Precache critical offline assets only. Do NOT call skipWaiting() here.
// Unconditional skipWaiting() in install activates the new SW while old
// clients are still running, which can cause the activate handler to delete
// caches the old page is actively using, breaking mid-session asset loads.
// Instead, skipWaiting is triggered explicitly via the SKIP_WAITING message
// (sent by ServiceWorkerRegistration.tsx when the user acknowledges update).
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE
// Delete all caches not belonging to this SW version, then claim clients
// so the new SW takes control of existing pages without a reload.
// This runs after skipWaiting() resolves (either from message or on
// fresh install with no prior SW).
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => !ALL_CACHES.includes(key))
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH
// Route each request to the appropriate strategy.
// Order matters: more specific checks must come before general ones.
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // 1. Never intercept cross-origin requests.
    //    This covers MSAL (login.microsoftonline.com), Dataverse
    //    (*.dynamics.com), Craft CMS, and Vercel analytics.
    if (url.origin !== self.location.origin) return;

    // 2. Never intercept non-GET requests.
    //    POST/PUT/DELETE must always reach the network (MSAL token
    //    exchange, Dataverse writes, API mutations).
    if (event.request.method !== "GET") return;

    // 3. Never intercept API routes.
    //    All /api/* routes require Authorization headers. The SW cache
    //    key does not include headers, so caching any authenticated
    //    response is a security risk. The browser HTTP cache handles
    //    Cache-Control-based revalidation for these routes correctly.
    if (url.pathname.startsWith("/api/")) return;

    // 4. Fonts — CacheFirst, separate long-lived bucket.
    if (isFont(url)) {
        event.respondWith(cacheFirst(event.request, FONT_CACHE));
        return;
    }

    // 5. Static assets — CacheFirst, safe due to Next.js content hashing.
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(event.request, STATIC_CACHE));
        return;
    }

    // 6. Page navigations — NetworkFirst with offline fallback.
    //    The HTML shell contains no user-specific data (client-rendered).
    //    IMPORTANT: If server-rendered protected pages are ever added,
    //    remove them from this cache path or add a session check.
    if (event.request.mode === "navigate") {
        event.respondWith(networkFirstWithOfflineFallback(event.request));
        return;
    }

    // 7. Everything else — pass through without interception.
    //    Explicitly not calling event.respondWith() lets the browser
    //    handle the request natively.
});

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CacheFirst
 *
 * Return cached response immediately if available.
 * On miss: fetch from network, cache the response if successful, return it.
 * On network failure with no cache: return a minimal 503.
 *
 * Only use for assets where a stale response is always acceptable:
 * content-hashed static files and immutable font files.
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
 *
 * Always try the network first. On success, update the page cache and
 * return the fresh response. On network failure, serve the cached version
 * if available, otherwise serve the precached offline page.
 *
 * Only use for HTML navigations where the shell is safe to serve stale.
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES
// SKIP_WAITING: triggered by ServiceWorkerRegistration.tsx when the user
//   acknowledges a pending update. Activates the waiting SW immediately.
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});