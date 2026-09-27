"use client";

import { UserMenuTrigger } from "./userMenuOverlay";

interface MobileHeaderProps {
  onOpenMenu: () => void;
}

export default function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 left-0 w-full bg-primary border-b border-gray-300 flex items-center justify-between pb-2 pt-safe px-4">
      <h1 className="text-2xl text-white leading-none font-extrabold">My WSNA</h1>
      <UserMenuTrigger onOpen={onOpenMenu} />
    </header>
  );
}

/*

"use client";

import { usePathname } from "next/navigation";
import { UserMenuTrigger } from "./userMenuOverlay";

const ROUTE_TITLES: Record<string, string> = {
  "/home": "My WSNA",
  "/growth": "My Growth",
  "/membership": "My Membership",
};

const DEFAULT_TITLE = "My WSNA";

export default function MobileHeader() {
  const pathname = usePathname();
  const title = ROUTE_TITLES[pathname] ?? DEFAULT_TITLE;

  return (
    <header className="md:hidden sticky top-0 left-0 w-full bg-primary border-b border-gray-300 flex items-center justify-between pb-2 pt-safe px-4">
      <h1 className="text-2xl text-white leading-none font-extrabold">{title}</h1>
      <UserMenuTrigger />
    </header>
  );
}

*/