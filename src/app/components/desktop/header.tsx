"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenuPC from "./userMenu";

export default function HeaderPC() {
  const pathname = usePathname();

  const navItems = [
    { href: "/union", label: "My Union" },
    { href: "/growth", label: "My Growth" },
    { href: "/membership", label: "My Membership" },
    { href: "/support", label: "Support" },
  ];

  return (
    <nav className="hidden md:flex sticky top-0 w-full bg-primary border-b border-gray-300 px-4 py-2 items-center justify-between">
      <Link href="/" className="text-[24px] font-extrabold mr-8 text-white">
        My WSNA
      </Link>
      <div className="flex gap-[36px]">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`text-white text-[16px] ${
                isActive ? "font-bold" : "font-medium"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
      <UserMenuPC />
    </nav>
  );
}
