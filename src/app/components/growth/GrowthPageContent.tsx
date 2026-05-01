"use client";

import { useState } from "react";
import Resources from "@/app/components/global/Resources";

type TabConfig = {
    id: string;
    label: string;
    component: React.ReactNode;
};

export default function GrowthPageContent() {
    const tabs: TabConfig[] = [
        {
            id: "resources",
            label: "Resources",
            component: <Resources section="appResourceTopics_Growth" />,
        },
    ];

    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.component;

    return (
        <div>
            <div className="px-4 pt-2 flex gap-6 text-sm font-medium overflow-x-auto scrollbar-hidden whitespace-nowrap">
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
            <div className="w-full mx-auto">{activeTabContent}</div>
        </div>
    );
}