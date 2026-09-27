"use client";

import React from "react";
import { useUser } from "@/app/components/global/UserInfo";
import { useMembershipLinks } from "@/app/hooks/useMembershipLinks";
import NavCard from "@/app/components/global/NavCard";
import {
    MembershipCardIcon,
    FileOutlineIcon,
    BookOpenIcon,
} from "@/app/utils/icons";

export default function HomePageContent() {
    const { contact } = useUser();
    const { data: membershipLinks } = useMembershipLinks();

    // First name only - defensive split handles single-name edge case
    const firstName = contact?.fullname?.split(" ")[0] ?? "Member";

    // Regional association name - sourced from cached membership links
    // No extra API call - same module-level cache used by /membership page
    const regionalName = membershipLinks?.regional?.title ?? null;

    const cards = [
        {
            icon: <BookOpenIcon className="w-6 h-6" />,
            title: "My Growth Resources",
            description:
                "Access professional development materials and resources for your career growth.",
            href: "/growth",
        },
        {
            icon: <MembershipCardIcon className="w-6 h-6" />,
            title: "My Membership Card",
            description:
                "Find your member numbers, connect with your regional nurses association, and explore your membership benefits.",
            href: "/membership",
        },
        {
            icon: <FileOutlineIcon className="w-6 h-6" />,
            title: "My Membership Resources",
            description:
                "Download important documents including board meeting notes and membership materials.",
            href: "/membership?tab=resources",
        },
    ] as const;

    return (
        <div className="px-4 py-8 max-w-5xl mx-auto">
            {/* Welcome heading */}
            <h1 className="text-[32px] font-extrabold text-foreground mb-4">
                Welcome, {firstName}
            </h1>

            {/* Member number badge */}
            {contact?.employeeid && (
                <div className="inline-flex items-center gap-2 border border-gray-300 rounded px-3 py-1 mb-4">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        WSNA Member Number
                    </span>
                    <span className="text-[14px] font-semibold text-foreground">
                        {contact.employeeid.toString().replace(/,/g, "")}
                    </span>
                </div>
            )}

            {/* Facility name */}
            {contact?.primaryFacilityName && (
                <p className="text-[15px] text-foreground mb-1">
                    {contact.primaryFacilityName}
                </p>
            )}

            {/* Regional association name - from cached membership links */}
            {regionalName && (
                <p className="text-[15px] text-foreground mb-8">
                    {regionalName}
                </p>
            )}

            {/* Nav cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <NavCard
                        key={card.title}
                        icon={card.icon}
                        title={card.title}
                        description={card.description}
                        href={card.href}
                    />
                ))}
            </div>
        </div>
    );
}