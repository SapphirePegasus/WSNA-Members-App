"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/components/global/UserInfo";

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { status } = useUser();
    const router = useRouter();

    useEffect(() => {
        // Still initializing or checking Dataverse — do nothing yet
        if (status === "initializing" || status === "loading") return;

        // Signed out — redirect to login page
        if (status === "signed-out") {
            router.replace("/");
        }

        // "not-registered" and "unrecognized" redirects are handled in
        // UserProvider.checkMembership where the sessionStorage reason flag
        // is written before the redirect fires. AuthGuard renders nothing
        // for both states while the redirect is in flight.
    }, [status, router]);

    // Spinner during initializing or loading — no flash, no redirect yet
    if (status === "initializing" || status === "loading") {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Render nothing while any redirect is in flight
    if (
        status === "signed-out" ||
        status === "not-registered" ||
        status === "unrecognized"
    ) {
        return null;
    }

    // Registered — render the protected page
    return <>{children}</>;
}