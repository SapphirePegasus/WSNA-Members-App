"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// REASON KEY
// Must match the key written in UserInfo.tsx (NOT_A_MEMBER_REASON_KEY).
// Defined as a local constant here rather than imported to avoid pulling
// client-side module graph into a server component boundary.
// If the key name ever changes, update both locations.
// ─────────────────────────────────────────────────────────────────────────────
const NOT_A_MEMBER_REASON_KEY = "notAMemberReason";

type NotAMemberReason = "not-registered" | "unrecognized";

// ─────────────────────────────────────────────────────────────────────────────
// USERMSG
// All user-facing strings in one place — easy to update without touching
// component logic.
// ─────────────────────────────────────────────────────────────────────────────
const USERMSG: Record<
    NotAMemberReason,
    { heading: string; body: string }
> = {
    "not-registered": {
        heading: "You are not a WSNA member",
        body: "The email address you signed in with was not found in the WSNA member database. If you believe this is an error, please contact WSNA directly.",
    },
    "unrecognized": {
        heading: "Your account cannot be accessed",
        body: "Your account was found but does not currently qualify for portal access. If you believe this is an error, please contact WSNA directly.",
    },
};

export default function NotAMemberContent() {
    const [reason, setReason] = useState<NotAMemberReason>("not-registered");

    useEffect(() => {
        // Read and immediately clear — one-time use flag.
        // Falls back to "not-registered" if key is missing (e.g. user
        // navigates directly to this URL without going through auth flow).
        const stored = sessionStorage.getItem(NOT_A_MEMBER_REASON_KEY);
        sessionStorage.removeItem(NOT_A_MEMBER_REASON_KEY);

        if (stored === "unrecognized" || stored === "not-registered") {
            setReason(stored);
        }
    }, []);

    const { heading, body } = USERMSG[reason];

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center space-y-6">

                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-8 h-8 text-red-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                </div>

                {/* Heading + body — driven by reason */}
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {heading}
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                        {body}
                    </p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Contact info */}
                <div className="space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                        Contact WSNA
                    </p>
                    <a
                        href="mailto:membership@wsna.org"
                        className="text-base text-primary font-medium hover:underline"
                    >
                        membership@wsna.org
                    </a>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-white text-base font-medium hover:bg-primary-500 transition-colors"
                    >
                        Back to Home
                    </Link>
                    <a
                        href="https://www.wsna.org/membership"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border-2 border-gray-300 text-gray-700 text-base font-medium hover:bg-gray-50 transition-colors"
                    >
                        Learn About Membership
                    </a>
                </div>

            </div>
        </div>
    );
}