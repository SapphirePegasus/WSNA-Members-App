"use client";

import Link from "next/link";

export default function OfflinePageContent() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center space-y-6">

                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-8 h-8 text-gray-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                            <line x1="12" y1="20" x2="12.01" y2="20" />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        You are offline
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                        Please check your internet connection and try again.
                        Some pages you have visited recently may still be available.
                    </p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-white text-base font-medium hover:bg-primary-500 transition-colors"
                    >
                        Try again
                    </button>
                    <Link
                        href="/home"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border-2 border-gray-300 text-gray-700 text-base font-medium hover:bg-gray-50 transition-colors"
                    >
                        Go to Home
                    </Link>
                </div>

            </div>
        </div>
    );
}