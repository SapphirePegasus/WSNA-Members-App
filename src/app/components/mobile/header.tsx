"use client";

//import { usePathname } from "next/navigation";
import UserMenuMobile from "./userMenuOverlay";

export default function MobileHeader() {
  //const label = formatPathname(usePathname());

  return (
    <header className="md:hidden sticky top-0 left-0 w-full bg-primary border-b border-gray-300 flex items-center justify-between pb-2 pt-safe px-4">
      <h1 className="text-2xl text-white leading-none font-extrabold">My WSNA</h1>
      <UserMenuMobile />
    </header>
  );
}

/*function formatPathname(path: string) {
  if (path === "/") return "Home"; // If it's the root
  const route = path.replace(/^\/+/, ""); // Remove leading slash(es)
  return route.charAt(0).toUpperCase() + route.slice(1);
}*/
