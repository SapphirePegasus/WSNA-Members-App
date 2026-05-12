export type RouteConfig = {
    path: string;
    protected: boolean; // requires valid login + must exist in Dataverse contacts
    indexed: boolean;   // allow search engine crawlers (Google etc.)
};

export const routes: RouteConfig[] = [
    { path: "/", protected: false, indexed: true },
    { path: "/home", protected: true, indexed: false },
    { path: "/membership", protected: true, indexed: false },
    { path: "/growth", protected: true, indexed: false },
    { path: "/not-a-member", protected: false, indexed: false },
    { path: "/redirect", protected: false, indexed: false },
];

// Derived helpers — consumed by AuthGuard, robots.ts, and any future middleware.
// Never hardcode route lists anywhere else. Always add new routes above.

export const protectedPaths = routes
    .filter((r) => r.protected)
    .map((r) => r.path);

export const indexedPaths = routes
    .filter((r) => r.indexed)
    .map((r) => r.path);

export function isProtectedPath(pathname: string): boolean {
    return protectedPaths.includes(pathname);
}

export function isIndexedPath(pathname: string): boolean {
    return indexedPaths.includes(pathname);
}