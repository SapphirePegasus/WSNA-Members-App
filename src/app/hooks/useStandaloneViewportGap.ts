"use client";

import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useStandaloneViewportGap  (PWA-01)
//
// WebKit quirk: on a cold launch of an installed iOS web app (Home Screen,
// display: standalone, viewport-fit=cover, black-translucent status bar), the
// layout viewport is reported SHORTER than the screen by exactly the top
// safe-area inset. dvh/svh/lvh and window.innerHeight are all affected. The
// strip below the document is painted with the root canvas (white), and WebKit
// only corrects the viewport after the first scroll or resize.
//
// This hook measures the shortfall and publishes it as --standalone-vh-gap on
// <html>, so a full-screen shell can extend itself by that amount:
//
//   minHeight: "calc(100dvh + var(--standalone-vh-gap, 0px))"
//
// Guard rails (this is a workaround, so it is deliberately narrow):
//   - Only runs when navigator.standalone === true (iOS installed app).
//   - Only applies a gap when the shortfall matches the top safe-area inset
//     within 2px - the exact signature of this bug. Landscape, iPad windowed
//     mode, Android and normal browsers therefore always resolve to 0px.
//   - Event-driven (no polling) and fully cleaned up on unmount.
//
// Remove this hook once WebKit fixes the behavior.
// ─────────────────────────────────────────────────────────────────────────────

const GAP_TOLERANCE_PX = 2;
const CSS_VAR = "--standalone-vh-gap";

export function useStandaloneViewportGap(): void {
    useEffect(() => {
        const isStandalone =
            (navigator as Navigator & { standalone?: boolean }).standalone === true;
        if (!isStandalone) return;

        const root = document.documentElement;

        // Zero-size probe that resolves env(safe-area-inset-top) to pixels.
        const probe = document.createElement("div");
        probe.setAttribute("aria-hidden", "true");
        probe.style.cssText =
            "position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;" +
            "pointer-events:none;padding-top:env(safe-area-inset-top, 0px);";
        document.body.appendChild(probe);

        const update = () => {
            const insetTop = parseFloat(getComputedStyle(probe).paddingTop) || 0;
            const shortfall = Math.round(window.screen.height - window.innerHeight);
            const matchesKnownSignature =
                shortfall > 0 && Math.abs(shortfall - insetTop) <= GAP_TOLERANCE_PX;

            root.style.setProperty(CSS_VAR, `${matchesKnownSignature ? shortfall : 0}px`);
        };

        update();

        window.addEventListener("resize", update);
        window.addEventListener("orientationchange", update);
        window.addEventListener("pageshow", update);
        window.visualViewport?.addEventListener("resize", update);

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("orientationchange", update);
            window.removeEventListener("pageshow", update);
            window.visualViewport?.removeEventListener("resize", update);
            root.style.removeProperty(CSS_VAR);
            probe.remove();
        };
    }, []);
}