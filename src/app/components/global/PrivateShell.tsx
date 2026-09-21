"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/app/components/global/UserInfo";
import { captureRedirectTarget } from "@/app/lib/authRedirect";
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

// ── TEMP (MOB-05/08/09 diagnosis): delete this block and <TempDebugLabel /> after QA ──
const TEMP_DEBUG_LABEL = true;
const PRODUCTION_HOST = "my.wsna.org"; // never shows on production

function TempDebugLabel() {
    const [text, setText] = useState("");

    useEffect(() => {
        if (!TEMP_DEBUG_LABEL || window.location.hostname === PRODUCTION_HOST) return;

        // Hidden probe that resolves env(safe-area-inset-*) into pixel values.
        const probe = document.createElement("div");
        probe.style.cssText =
            "position:fixed;visibility:hidden;pointer-events:none;" +
            "padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0;";
        document.body.appendChild(probe);

        let maxGap = 0;
        const r = (n: number) => Math.round(n * 10) / 10;

        const update = () => {
            const vv = window.visualViewport;
            const top = vv?.offsetTop ?? 0;
            const bottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
            const cs = getComputedStyle(probe);
            const nav = Array.from(document.querySelectorAll("nav")).find(
                (n) => getComputedStyle(n).position === "fixed"
            );
            const navRect = nav?.getBoundingClientRect();
            const header = document.querySelector("header");
            const panel = document
                .querySelector('[role="dialog"]')
                ?.getBoundingClientRect();

            // Positive gap = bar floats above the visible bottom (MOB-05).
            if (navRect) maxGap = Math.max(maxGap, bottom - navRect.bottom);

            const lines = [
                `standalone ${String((navigator as Navigator & { standalone?: boolean }).standalone)}`,
                `inner ${window.innerWidth}x${window.innerHeight}`,
                `visual ${vv ? `${r(vv.width)}x${r(vv.height)} top=${r(vv.offsetTop)}` : "n/a"}`,
                `inset T=${cs.paddingTop} B=${cs.paddingBottom}`,
            ];
            if (header) {
                lines.push(`header padT=${getComputedStyle(header).paddingTop} top=${r(header.getBoundingClientRect().top - top)}`);
            }
            if (navRect) {
                lines.push(`nav h=${r(navRect.height)} gap=${r(bottom - navRect.bottom)} max=${r(maxGap)}`);
            }
            if (panel) {
                lines.push(`panel T=${r(panel.top - top)} B=${r(bottom - panel.bottom)} L=${r(panel.left)} R=${r(window.innerWidth - panel.right)}`);
            }
            setText(lines.join("\n"));
        };

        const interval = window.setInterval(update, 300);
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        window.visualViewport?.addEventListener("resize", update);
        window.visualViewport?.addEventListener("scroll", update);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            window.visualViewport?.removeEventListener("resize", update);
            window.visualViewport?.removeEventListener("scroll", update);
            probe.remove();
        };
    }, []);

    if (!text) return null;
    return (
        <pre
            aria-hidden="true"
            className="pointer-events-none fixed left-2 top-1/2 z-[100] -translate-y-1/2 whitespace-pre rounded bg-black/80 p-2 font-mono text-[10px] leading-tight text-lime-300"
        >
            {text}
        </pre>
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