"use client";

import React from "react";
import { useResources } from "@/app/hooks/useResources";
import ResourceTopic from "@/app/components/global/ResourceTopic";
import type { ResourceSection } from "@/app/types/resources";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// `section` is the only required prop - the Craft CMS section handle.
// This is what makes the component reusable across any page or tab:
//
//   Growth resources tab:
//     <Resources section="appResourceTopics_Growth" />
//
//   Membership resources tab:
//     <Resources section="appResourceTopics_Membership" />
//
//   Any future section:
//     <Resources section="appResourceTopics_Whatever" />
//
// No other configuration is needed - the component handles fetching,
// caching, loading state, error state, and empty state internally.
// ─────────────────────────────────────────────────────────────────────────────
interface ResourcesProps {
    section: ResourceSection;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// Renders two topic-shaped skeletons to approximate the expected layout.
// Extracted as a named component (not inline JSX) so the main component body
// stays readable and the skeleton can be adjusted independently.
// ─────────────────────────────────────────────────────────────────────────────
function ResourcesSkeleton() {
    return (
        <div className="animate-pulse space-y-8 px-4 py-6">
            {[0, 1].map((i) => (
                <div key={i} className="space-y-3">
                    {/* Topic heading placeholder */}
                    <div className="h-6 bg-gray-200 rounded w-48" />
                    {/* Topic description placeholder */}
                    <div className="h-4 bg-gray-100 rounded w-72" />
                    {/* Two card placeholders in a grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {[0, 1].map((j) => (
                            <div key={j} className="h-16 bg-gray-100 rounded-lg border border-gray-200" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE
// Shown when the API fetch fails. Displays the error message from the hook
// which originates from the API route's structured error response.
// ─────────────────────────────────────────────────────────────────────────────
function ResourcesError({ message }: { message: string }) {
    return (
        <div className="px-4 py-10 text-center">
            <p className="text-[15px] text-gray-500">
                {message}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// Shown when the fetch succeeds but the section has no publishable topics.
// ─────────────────────────────────────────────────────────────────────────────
function ResourcesEmpty() {
    return (
        <div className="px-4 py-10 text-center">
            <p className="text-[15px] text-gray-500">
                No resources are available at this time.
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCES
// Top-level component. Has the three possible states (loading, error,
// success) and renders the topic tree when data is available.
//
// This component owns no business logic - all data work happens in useResources,
// buildTopicTree, and the API route. This component just connects them to the UI.
// ─────────────────────────────────────────────────────────────────────────────
export default function Resources({ section }: ResourcesProps) {
    const { data, loading, error } = useResources(section);

    if (loading) {
        return (
            <div className="bg-[#fafafa] min-h-screen">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <ResourcesSkeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#fafafa] min-h-screen">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <ResourcesError message={error} />
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-[#fafafa] min-h-screen">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <ResourcesEmpty />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#fafafa] min-h-screen">
            <div className="max-w-3xl mx-auto px-4 py-6">
                {data.map((topic, index) => (
                    <ResourceTopic key={topic.id} topic={topic} isFirst={index === 0} />
                ))}
            </div>
        </div>
    );
}