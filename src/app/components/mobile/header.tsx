"use client";

import type { RefObject } from "react";
import { UserMenuTrigger } from "./userMenuOverlay";

interface MobileHeaderProps {
  onOpenMenu: () => void;
  menuOpen: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export default function MobileHeader({ onOpenMenu, menuOpen, triggerRef }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 left-0 w-full bg-primary border-b border-gray-300 flex items-center justify-between pb-2 pt-safe px-4">
      <h1 className="text-2xl text-white leading-none font-extrabold">My WSNA</h1>
      <UserMenuTrigger onOpen={onOpenMenu} isOpen={menuOpen} triggerRef={triggerRef} />
    </header>
  );
}