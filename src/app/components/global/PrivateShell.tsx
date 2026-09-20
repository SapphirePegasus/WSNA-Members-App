"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/app/components/global/UserInfo";
import { captureRedirectTarget } from "@/app/lib/authRedirect";
import {
    MobileMenuProvider,
    useMobileMenu,
} from "@/app/contexts/MobileMenuContext";
import Header from "@/app/components/mobile/header";
import BottomNav from "@/app/components/mobile/bottomNav";
import HeaderPC from "@/app/components/desktop/header";
import { UserMenuPanel } from "@/app/components/mobile/userMenuOverlay";

function FullScreenSpinner() {
    return (
        <div
            role="status"
            aria-label="Loading"
            className="flex h-dvh w-full items-center justify-center"
        >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
}

// Separate component so useMobileMenu() runs below MobileMenuProvider.
function PrivateChrome({ children }: { children: React.ReactNode }) {
    const { isOpen } = useMobileMenu();

    return (
        <>
            <div className="min-h-dvh" inert={isOpen || undefined}>
                <Header />
                <HeaderPC />
                <main>{children}</main>
                <BottomNav
                    hideOnScrollDown={true}
                    unhideOnScrollUp={true}
                    unhideOnScrollStop={false}
                />
            </div>
            <UserMenuPanel />
        </>
    );
}

export default function PrivateShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { status } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status !== "signed-out") return;
        captureRedirectTarget(pathname, window.location.search);
        router.replace("/");
    }, [status, pathname, router]);

    if (status === "initializing" || status === "loading") {
        return <FullScreenSpinner />;
    }

    if (status !== "registered") return null;

    // Provider mounts only for registered users, so menu state resets on sign-out.
    return (
        <MobileMenuProvider>
            <PrivateChrome>{children}</PrivateChrome>
        </MobileMenuProvider>
    );
}