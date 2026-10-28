"use client";

import { useSearchParams } from "next/navigation";
import MembershipCard from "@/app/components/global/MembershipCard";
import Resources from "@/app/components/global/Resources";
import Tabs, { type TabConfig } from "@/app/components/global/Tabs";

// Add future tabs (Dues, Contact Details, Password) by appending entries here.
const TABS: readonly TabConfig[] = [
    {
        id: "card",
        label: "Membership Card",
        content: <MembershipCard />,
    },
    {
        id: "resources",
        label: "Resources",
        content: <Resources section="appResourceTopics_Membership" />,
    },
];

export default function MembershipPageContent() {
    // Deep link support: /membership?tab=resources. Read once at mount, as before.
    const initialTabId = useSearchParams().get("tab");

    return (
        <Tabs
            tabs={TABS}
            initialTabId={initialTabId}
            ariaLabel="Membership sections"
        />
    );
}