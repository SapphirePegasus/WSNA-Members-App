// src/app/hooks/useMembershipLinks.ts

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/app/components/global/UserInfo";
import type {
    MembershipLinksResponse,
    MembershipLinksRequest,
} from "@/app/types/membership";

const membershipLinksCache = new Map<string, MembershipLinksResponse>();

interface UseMembershipLinksState {
    data: MembershipLinksResponse | null;
    loading: boolean;
    error: string | null;
}

export function useMembershipLinks(): UseMembershipLinksState {
    const { contact } = useUser();

    const [state, setState] = useState<UseMembershipLinksState>(() => {
        if (!contact?.contactid) {
            return { data: null, loading: false, error: null };
        }

        const cached = membershipLinksCache.get(contact.contactid);
        if (cached) {
            return { data: cached, loading: false, error: null };
        }

        return { data: null, loading: true, error: null };
    });

    useEffect(() => {
        // Guard — contact must be present with a valid id
        if (!contact?.contactid) {
            setState({ data: null, loading: false, error: null });
            return;
        }

        // Cache hit — update state from cache and bail, no fetch needed
        const cached = membershipLinksCache.get(contact.contactid);
        if (cached) {
            setState({ data: cached, loading: false, error: null });
            return;
        }

        const controller = new AbortController();
        let cancelled = false;

        async function fetchAndCache(): Promise<void> {
            // Build request payload from contact context.
            // All fields are derived here — no prop drilling required.
            const payload: MembershipLinksRequest = {
                facilityCode: contact!.primaryFacilityCode,
                districtCode: contact!.districtCode,
                isUnionMember: contact!.wsna_showaft ?? false,
            };

            try {
                const res = await fetch("/api/membershiplinks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(
                        body.error ??
                        `Request failed with status ${res.status}`
                    );
                }

                const data: MembershipLinksResponse = await res.json();

                // Populate cache before setting state — any concurrent mount
                // of the same contact will hit the cache immediately
                membershipLinksCache.set(contact!.contactid, data);

                if (!cancelled) {
                    setState({ data, loading: false, error: null });
                }
            } catch (err) {
                if (cancelled) return;

                // AbortError is intentional cancellation — not a real error
                if (
                    err instanceof DOMException &&
                    err.name === "AbortError"
                ) return;

                console.error(
                    "[useMembershipLinks] Failed to fetch membership links:",
                    err
                );

                if (!cancelled) {
                    setState({
                        data: null,
                        loading: false,
                        error:
                            err instanceof Error
                                ? err.message
                                : "An unexpected error occurred while loading membership links.",
                    });
                }
            }
        }

        fetchAndCache();

        // Cleanup — abort in-flight request and mark as cancelled so any
        // stale setState calls after unmount are silently dropped
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [contact?.contactid]);
    // ↑ Dependency is contactid only — not the full contact object.
    // The object reference changes on every render but contactid is stable.
    // This prevents the effect from re-running unnecessarily.

    return state;
}