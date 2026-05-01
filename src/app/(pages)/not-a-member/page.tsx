import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Not a Member",
    description: "Your account was not found in the WSNA member database.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function NotAMemberPage() {
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
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        You are not a WSNA member
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                        The email address you signed in with was not found in the WSNA
                        member database. If you believe this is an error, please contact
                        WSNA directly.
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
                        href="mailto:membershipdb@wsna.org"
                        className="text-base text-primary font-medium hover:underline"
                    >
                        membershipdb@wsna.org
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