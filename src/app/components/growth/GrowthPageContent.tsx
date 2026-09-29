"use client";

import Resources from "@/app/components/global/Resources";
import Tabs, { type TabConfig } from "@/app/components/global/Tabs";

const TABS: readonly TabConfig[] = [
    {
        id: "resources",
        label: "Resources",
        content: <Resources section="appResourceTopics_Growth" />,
    },
];

export default function GrowthPageContent() {
    return <Tabs tabs={TABS} ariaLabel="Growth sections" />;
}