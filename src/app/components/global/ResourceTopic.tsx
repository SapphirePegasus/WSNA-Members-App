"use client";

import React from "react";
import DownloadCard from "@/app/components/global/DownloadCard";
import type { TopicNode } from "@/app/types/resources";

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC HEADING STYLES
// Each level has distinct typography per the design shown in Image 1:
//   Level 1 - large bold heading, clear section break
//   Level 2 - medium bold heading, subordinate to level 1
//   Level 3 - small uppercase label, tertiary grouping
//
// Defined as a lookup rather than conditional chains so adding a level 4
// (if Craft ever introduces deeper nesting) is a one-line change here.
// ─────────────────────────────────────────────────────────────────────────────
const TOPIC_HEADING_STYLES: Record<number, string> = {
    1: "text-2xl font-bold text-foreground",
    2: "text-lg font-bold text-foreground",
    3: "text-xs font-semibold uppercase tracking-wider text-foreground",
};

const TOPIC_DESCRIPTION_STYLES: Record<number, string> = {
    1: "text-sm text-gray-500 mt-1.5",   // 6px gap
    2: "text-sm text-gray-500 mt-1.5",
    3: "text-xs text-gray-500 mt-1",
};

// Vertical spacing above each topic level - level 1 gets the most breathing
// room as a primary section break, level 2 and 3 progressively less.
const TOPIC_SPACING_STYLES: Record<number, string> = {
    1: "mt-6 first:mt-0",
    2: "mt-6",
    3: "mt-4",
};

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────
interface ResourceTopicProps {
    topic: TopicNode;
    isFirst?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCE TOPIC
// Renders a single topic node and recursively renders its children.
// Handles the 2-column responsive card grid for file assets.
//
// Recursion is safe here because Craft CMS structures are capped at 3 levels
// per the spec. Even if that changes, React's call stack limit is not a
// practical concern at these depths.
//
// The component does not filter children itself - filtering was done once
// in buildTopicTree (topicHasVisibleContent). Every TopicNode that reaches
// this component is guaranteed to have displayable content.
// ─────────────────────────────────────────────────────────────────────────────
export default function ResourceTopic({ topic, isFirst = false }: ResourceTopicProps) {
    const level = topic.level in TOPIC_HEADING_STYLES ? topic.level : 1;
    const headingClass = TOPIC_HEADING_STYLES[level] ?? TOPIC_HEADING_STYLES[1];
    const descriptionClass = TOPIC_DESCRIPTION_STYLES[level] ?? TOPIC_DESCRIPTION_STYLES[1];
    const spacingClass = TOPIC_SPACING_STYLES[level] ?? TOPIC_SPACING_STYLES[1];

    return (
        <section className={spacingClass}>

            {/* Divider above level 1 sections except the first */}
            {level === 1 && !isFirst && (
                <hr className="border-t border-gray-200 mb-6" />
            )}

            <div className="mb-1.5">
                <h2 className={headingClass}>{topic.title}</h2>
                {topic.description && (
                    <p className={descriptionClass}>{topic.description}</p>
                )}
            </div>

            {topic.files.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    {topic.files.map((file) => (
                        <DownloadCard key={file.id} file={file} />
                    ))}
                </div>
            )}

            {topic.children.length > 0 && (
                <div className="mt-2">
                    {topic.children.map((child) => (
                        <ResourceTopic key={child.id} topic={child} />
                    ))}
                </div>
            )}

        </section>
    );
}