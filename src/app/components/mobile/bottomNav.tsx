"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  HomeActiveIcon,
  UnionIcon,
  UnionActiveIcon,
  GrowthIcon,
  GrowthActiveIcon,
  NewsIcon,
  NewsActiveIcon,
  SupportIcon,
  SupportActiveIcon,
} from "@/app/utils/icons";

export default function BottomNav({
  hideOnScrollDown = true,
  unhideOnScrollUp = true,
  unhideOnScrollStop = false,
}) {
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

  const lastScrollYRef = useRef(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  const scrollStopTimeoutRef = useRef<number | null>(null);

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: HomeIcon,
      activeIcon: HomeActiveIcon,
    },
    {
      href: "/union",
      label: "Union",
      icon: UnionIcon,
      activeIcon: UnionActiveIcon,
    },
    {
      href: "/growth",
      label: "Growth",
      icon: GrowthIcon,
      activeIcon: GrowthActiveIcon,
    },
    {
      href: "/news",
      label: "News",
      icon: NewsIcon,
      activeIcon: NewsActiveIcon,
    },
    {
      href: "/support",
      label: "Support",
      icon: SupportIcon,
      activeIcon: SupportActiveIcon,
    },
  ];

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollYRef.current;

      // Cancel any existing "scroll stop" timer.
      if (scrollStopTimeoutRef.current) {
        window.clearTimeout(scrollStopTimeoutRef.current);
        scrollStopTimeoutRef.current = null;
      }

      // Hide nav on scroll down
      if (hideOnScrollDown && isScrollingDown) {
        setHidden(true);
      }

      // Unhide nav on scroll up
      if (unhideOnScrollUp && !isScrollingDown) {
        setHidden(false);
      }

      // If unhideOnScrollStop is true, set a timer to unhide after 200ms of no scroll
      if (unhideOnScrollStop) {
        scrollStopTimeoutRef.current = window.setTimeout(() => {
          // If no scroll event fired in 200ms, user stopped scrolling
          setHidden(false);
        }, 200);
      }

      lastScrollYRef.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollStopTimeoutRef.current) {
        window.clearTimeout(scrollStopTimeoutRef.current);
      }
    };
  }, [hideOnScrollDown, unhideOnScrollUp, unhideOnScrollStop]);

  return (
    <nav
      className={`
        md:hidden
        fixed bottom-0 left-0 w-full bg-white border-t border-gray-200
        flex justify-around items-center py-2
        transition-transform duration-300 ease-in-out
        ${hidden ? "translate-y-full" : "translate-y-0"}
      `}
    >
      {navItems.map(
        ({ href, label, icon: InactiveIcon, activeIcon: ActiveIcon }) => {
          const isActive = pathname === href;
          const IconComponent = isActive ? ActiveIcon : InactiveIcon;

          return (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center text-sm text-gray-700"
            >
              <IconComponent className="w-6 h-6 mb-1" />
              <span>{label}</span>
            </Link>
          );
        }
      )}
    </nav>
  );
}
