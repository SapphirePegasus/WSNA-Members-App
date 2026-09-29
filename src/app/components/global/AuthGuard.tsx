"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/app/components/global/UserInfo";
import { captureRedirectTarget } from "@/app/lib/authRedirect";

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { status } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Still initializing or checking Dataverse — do nothing yet
        if (status === "initializing" || status === "loading") return;

        // Signed out — remember where the user was trying to go (path +
        // query, e.g. /membership?tab=resources) so login can restore it,
        // then redirect to the login page.
        if (status === "signed-out") {
            // window.location.search is client-only and needs no Suspense
            // boundary, unlike the useSearchParams() hook - which would force
            // every page under this guard to bail out of static prerendering.
            captureRedirectTarget(pathname, window.location.search);
            router.replace("/");
        }

        // "not-registered" and "unrecognized" redirects are handled in
        // UserProvider.checkMembership where the sessionStorage reason flag
        // is written before the redirect fires. AuthGuard renders nothing
        // for both states while the redirect is in flight.
    }, [status, router, pathname]);

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