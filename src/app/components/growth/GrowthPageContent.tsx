"use client";

import { useState } from "react";

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
            component: <div>UNDER DEVELOPMENT</div>,
        },
    ];


    return (
        <div>
            UNDER DEVELOPMENT
        </div>
    );
}