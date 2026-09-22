"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/app/components/global/UserInfo";
import { captureRedirectTarget } from "@/app/lib/authRedirect";
import Header from "@/app/components/mobile/header";
import BottomNav from "@/app/components/mobile/bottomNav";
import HeaderPC from "@/app/components/desktop/header";
import { UserMenuPanel } from "@/app/components/mobile/userMenuOverlay";
import { TempDebugLabel } from "@/app/components/global/LoginButton";

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

function PrivateChrome({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const openMenu = useCallback(() => setMenuOpen(true), []);
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    // The account panel is mobile-only. Close it if the viewport grows past
    // Tailwind's `md` (768px), e.g. iPad rotation; otherwise the inert wrapper
    // would leave the app unreachable behind an invisible panel.
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const onChange = (e: MediaQueryListEvent) => {
            if (e.matches) setMenuOpen(false);
        };
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    return (
        <>
            <div className="min-h-dvh" inert={menuOpen || undefined}>
                <Header onOpenMenu={openMenu} />
                <HeaderPC />
                <main>{children}</main>
                <BottomNav />
            </div>
            <UserMenuPanel isOpen={menuOpen} onClose={closeMenu} />
            <TempDebugLabel />
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

    return <PrivateChrome>{children}</PrivateChrome>;
}