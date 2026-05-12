"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import MembershipCard from "@/app/components/global/MembershipCard";
import Resources from "../global/Resources";

type TabConfig = {
    id: string;
    label: string;
    component: React.ReactNode;
};

export default function MembershipPageContent() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") ?? "card";

    const tabs: TabConfig[] = [
        {
            id: "card",
            label: "Membership Card",
            component: <MembershipCard />,
        },
        {
            id: "resources",
            label: "Resources",
            component: <Resources section="appResourceTopics_Membership" />,
        },
        /*{
            id: "dues",
            label: "Dues",
            component: <div className="pt-6 text-gray-600">Dues</div>,
        },
        {
            id: "contact",
            label: "Contact Details", 
            component: <div className="pt-6 text-gray-600">Contact details</div>,
        },
        {
            id: "password",
            label: "Password",
            component: <div className="pt-6 text-gray-600">Password</div>,
        },*/

    ];

    const [activeTab, setActiveTab] = useState(
        tabs.some(t => t.id === initialTab) ? initialTab : tabs[0].id
    );

    const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.component;

    return (
        <div>
            {/* Tabs */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-2 flex gap-6 text-sm font-medium overflow-x-auto scrollbar-hidden whitespace-nowrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 cursor-pointer text-base ${activeTab === tab.id
                            ? "border-b-3 border-black text-foreground font-semibold"    //active
                            : "border-b-3 border-transparent text-gray-500 font-semibold"  //inactive
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="w-full mx-auto">{activeTabContent}</div>
        </div>
    );
}