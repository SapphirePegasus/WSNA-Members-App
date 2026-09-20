"use client";

import { useState, useEffect } from "react";
import { buildTopicTree } from "@/app/lib/resourcesUtils";
import type {
    TopicNode,
    ResourceSection,
    ResourcesApiResponse,
} from "@/app/types/resources";
import { getIdToken } from "@/app/lib/getIdToken";

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL CACHE
// Lives outside React - survives component unmounts, tab switches, and
// re-renders. Keyed by section string so Growth and Membership (or any future
// section) each maintain their own independent cache entry.
//
// This is intentionally a plain Map, not useState or useRef, because:
//   - useState resets on unmount (tab switch would clear it)
//   - useRef is per-instance (two components mounting the same section
//     would each fetch independently)
//   - A module-level Map persists for the lifetime of the browser session,
//     shared across all instances, which is exactly what we need.
//
// The cache stores the already-built TopicNode tree, not raw API data,
// so buildTopicTree only runs once per section per session.
// ─────────────────────────────────────────────────────────────────────────────
const topicTreeCache = new Map<ResourceSection, TopicNode[]>();

// ─────────────────────────────────────────────────────────────────────────────
// HOOK STATE SHAPE
// Three mutually exclusive states - loading, error, and success.
// `data` is null until a successful fetch completes.
// `error` is null unless the fetch fails.
// ─────────────────────────────────────────────────────────────────────────────
interface UseResourcesState {
    data: TopicNode[] | null;
    loading: boolean;
    error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// useResources
// Fetches resource topics for the given section, builds the topic tree,
// and caches the result for the lifetime of the browser session.
//
// On subsequent calls with the same section (e.g. user switches tabs and
// comes back), the cache is hit synchronously and no network request is made.
//
// Usage:
//   const { data, loading, error } = useResources("appResourceTopics_Growth");
// ─────────────────────────────────────────────────────────────────────────────
export function useResources(section: ResourceSection): UseResourcesState {
    // ───────────────────────────────────────────────────────────────────────────
    // Initialise state from cache synchronously if available.
    // This means on a tab switch back to a previously loaded section, the
    // component renders with data immediately - no loading flash, no spinner.
    // ───────────────────────────────────────────────────────────────────────────
    const [state, setState] = useState<UseResourcesState>(() => {
        const cached = topicTreeCache.get(section);
        if (cached) {
            return { data: cached, loading: false, error: null };
        }
        return { data: null, loading: true, error: null };
    });

    useEffect(() => {
        // If already in cache (set before this effect runs or on a re-render),
        // update state from cache and bail - no fetch needed.
        const cached = topicTreeCache.get(section);
        if (cached) {
            setState({ data: cached, loading: false, error: null });
            return;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // ABORT CONTROLLER
        // If the section prop changes before the fetch completes (e.g. user
        // switches tabs rapidly), the in-flight request is aborted and its
        // result is discarded. Prevents stale data from overwriting current state.
        // ─────────────────────────────────────────────────────────────────────────
        const controller = new AbortController();
        let cancelled = false;

        async function fetchAndCache(): Promise<void> {
            try {
                const idToken = await getIdToken();
                if (!idToken) {
                    setState({
                        data: null,
                        loading: false,
                        error: "Session expired. Please sign in again.",
                    });
                    return;
                }

                const response = await fetch(
                    `/api/resources?section=${encodeURIComponent(section)}`,
                    {
                        signal: controller.signal,
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    }
                );

                if (response.status === 429) {
                    const retryAfter = response.headers.get("Retry-After") ?? "60";
                    throw new Error(
                        `Too many requests. Please wait ${retryAfter} seconds before trying again.`
                    );
                }

                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(
                        body.error ?? `Request failed with status ${response.status}`
                    );
                }

                const body: ResourcesApiResponse = await response.json();

                // Build the tree once - this is the only call to buildTopicTree
                // for this section for the entire browser session.
                const tree = buildTopicTree(body.topics);

                // Populate the module-level cache before updating state so that any
                // concurrent mount of the same section immediately gets the cached value.
                topicTreeCache.set(section, tree);

                if (!cancelled) {
                    setState({ data: tree, loading: false, error: null });
                }
            } catch (err) {
                if (cancelled) return;

                // AbortError is not a real error - it means we intentionally cancelled.
                if (err instanceof DOMException && err.name === "AbortError") return;

                console.error(`[useResources] Failed to load section "${section}":`, err);

                setState({
                    data: null,
                    loading: false,
                    error:
                        err instanceof Error
                            ? err.message
                            : "An unexpected error occurred while loading resources.",
                });
            }
        }

        fetchAndCache();

        // Cleanup - abort the fetch and mark as cancelled so stale setState
        // calls after unmount or section change are silently dropped.
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [section]);

    return state;
}