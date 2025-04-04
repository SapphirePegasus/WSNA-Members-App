"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenuPC from "./userMenu";

export default function HeaderPC() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/union", label: "Union" },
    { href: "/growth", label: "Growth" },
    { href: "/news", label: "News" },
    { href: "/support", label: "Support" },
  ];

  return (
    <nav className="hidden md:flex sticky top-0 w-full bg-white border-b border-gray-300 px-4 py-2 items-center justify-between">
      <Link href="/" className="text-[24px] font-extrabold mr-8">
        My WSNA
      </Link>
      <div className="flex gap-[36px]">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`text-sm font-medium text-[16px] ${
                isActive ? "text-black" : "text-gray-600"
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
