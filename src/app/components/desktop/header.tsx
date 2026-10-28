"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenuPC from "./userMenu";

export default function HeaderPC() {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", label: "Home" },
    { href: "/growth", label: "My Growth" },
    { href: "/membership", label: "My Membership" },
  ];

  return (
    <nav className="hidden md:block sticky top-0 w-full bg-primary border-b border-gray-300 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
        <Link href="/home" className="text-2xl font-extrabold mr-8 text-white">
          My WSNA
        </Link>
        <div className="flex gap-[36px]">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`text-base ${isActive ? "text-white font-bold" : "text-blue-200 font-medium"}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <UserMenuPC />
      </div>
    </nav>
  );
}
