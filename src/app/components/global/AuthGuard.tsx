"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/app/components/global/UserInfo";

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { status } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Still initializing or checking Dataverse - do nothing yet
        if (status === "initializing" || status === "loading") return;

        // Not authenticated or not a member - store intended path and redirect home
        if (status === "signed-out" || status === "not-registered") {
            sessionStorage.setItem("redirectAfterLogin", pathname);
            router.replace("/");
        }
    }, [status, pathname, router]);

    // While initializing or loading show nothing - no flash, no redirect yet
    if (status === "initializing" || status === "loading") {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Not registered or signed out - render nothing while redirect is in flight
    if (status === "signed-out" || status === "not-registered") {
        return null;
    }

    // Registered - render the protected page
    return <>{children}</>;
}