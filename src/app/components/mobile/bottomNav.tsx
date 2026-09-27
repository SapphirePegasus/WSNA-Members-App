"use client";

import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  HomeActiveIcon,
  GrowthIcon,
  GrowthActiveIcon,
  MembershipCardIcon,
  MembershipCardActiveIcon,
} from "@/app/utils/icons";

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV CONFIG - single place to tune size and behaviour.
// All values are CSS px unless stated. Dimensions are applied via inline styles
// (Tailwind cannot generate classes from runtime values).
// ─────────────────────────────────────────────────────────────────────────────
interface BottomNavConfig {
  contentHeightPx: number; // bar height ABOVE the safe-area inset (excl. 1px divider)
  itemMinWidthPx: number; // minimum touch target width per item
  itemMinHeightPx: number; // minimum touch target height per item
  iconSizePx: number;
  labelFontSizePx: number;
  autoHide: {
    enabled: boolean; // master switch: false = bar is always visible
    hideOnScrollDown: boolean;
    showOnScrollUp: boolean;
    showAtPageTop: boolean; // always visible when scrolled to the very top
    showWhenIdle: boolean; // reveal after scrolling stops
    idleRevealMs: number; // used only when showWhenIdle is true
    scrollThresholdPx: number; // ignore movement smaller than this (jitter)
    transitionMs: number;
  };
}

const BOTTOM_NAV_CONFIG: BottomNavConfig = {
  contentHeightPx: 68,
  itemMinWidthPx: 48,
  itemMinHeightPx: 48,
  iconSizePx: 24,
  labelFontSizePx: 12,
  autoHide: {
    enabled: true,
    hideOnScrollDown: true,
    showOnScrollUp: true,
    showAtPageTop: true,
    showWhenIdle: false,
    idleRevealMs: 200,
    scrollThresholdPx: 10,
    transitionMs: 300,
  },
};

const DIVIDER_PX = 1; // matches the `border-t` class on the nav

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  activeIcon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon, activeIcon: HomeActiveIcon },
  { href: "/growth", label: "Growth", icon: GrowthIcon, activeIcon: GrowthActiveIcon },
  {
    href: "/membership",
    label: "Membership",
    icon: MembershipCardIcon,
    activeIcon: MembershipCardActiveIcon,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-HIDE
// - rAF-throttled, passive scroll listener
// - scroll position is clamped to [0, maxScroll] so iOS rubber-band overscroll
//   (negative / beyond-end values) never toggles the bar
// - hidden state is keyed by pathname, so a route change resets it without an
//   effect that sets state synchronously
// ─────────────────────────────────────────────────────────────────────────────
function useAutoHide(
  pathname: string,
  cfg: BottomNavConfig["autoHide"]
): { hidden: boolean; reveal: () => void } {
  const [state, setState] = useState({ hidden: false, path: pathname });

  useEffect(() => {
    if (!cfg.enabled) return;

    let lastY = window.scrollY;
    let frame = 0;
    let idleTimer: number | undefined;

    const set = (hidden: boolean) =>
      setState((prev) =>
        prev.hidden === hidden && prev.path === pathname
          ? prev
          : { hidden, path: pathname }
      );

    const onFrame = () => {
      frame = 0;
      const maxY = Math.max(
        0,
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight
      );
      const y = Math.min(Math.max(window.scrollY, 0), maxY);

      if (cfg.showAtPageTop && y <= 0) {
        set(false);
        lastY = y;
      } else {
        const delta = y - lastY;
        if (Math.abs(delta) >= cfg.scrollThresholdPx) {
          if (delta > 0 && cfg.hideOnScrollDown) set(true);
          else if (delta < 0 && cfg.showOnScrollUp) set(false);
          lastY = y;
        }
      }

      if (cfg.showWhenIdle) {
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(() => set(false), cfg.idleRevealMs);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(onFrame);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
    };
  }, [pathname, cfg]);

  const reveal = () =>
    setState((prev) =>
      prev.hidden ? { hidden: false, path: pathname } : prev
    );

  return {
    hidden: cfg.enabled && state.hidden && state.path === pathname,
    reveal,
  };
}

export default function BottomNav() {
  const pathname = usePathname();
  const c = BOTTOM_NAV_CONFIG;
  const { hidden, reveal } = useAutoHide(pathname, c.autoHide);

  const totalHeight = `calc(${c.contentHeightPx + DIVIDER_PX}px + env(safe-area-inset-bottom, 0px))`;

  return (
    <>
      {/* In-flow spacer so the last page content is never hidden behind the
          fixed bar. Stays put when the bar hides, so layout never reflows. */}
      <div aria-hidden="true" className="md:hidden" style={{ height: totalHeight }} />

      <nav
        aria-label="Primary"
        // Keyboard users tabbing into a hidden bar must see it.
        onFocusCapture={reveal}
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white transition-transform ease-in-out motion-reduce:transition-none"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
          transform: hidden ? "translateY(100%)" : "translateY(0)",
          transitionDuration: `${c.autoHide.transitionMs}ms`,
        }}
      >
        <div className="flex items-stretch" style={{ height: c.contentHeightPx }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon, activeIcon: ActiveIcon }) => {
            const isActive = pathname === href;
            const IconComponent = isActive ? ActiveIcon : Icon;

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-1 select-none touch-manipulation flex-col items-center justify-center gap-0.5 whitespace-nowrap font-medium [-webkit-tap-highlight-color:transparent]"
                style={{
                  minWidth: c.itemMinWidthPx,
                  minHeight: c.itemMinHeightPx,
                  fontSize: c.labelFontSizePx,
                  lineHeight: 1.25,
                }}
              >
                <IconComponent
                  aria-hidden="true"
                  focusable="false"
                  style={{ width: c.iconSizePx, height: c.iconSizePx }}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}