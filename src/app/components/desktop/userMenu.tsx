"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@/app/components/global/UserInfo";
import { ProfileIcon, SignOutCrossIcon } from "@/app/utils/icons";

export default function UserMenuPC() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return <div className="text-white text-sm">Please Log-In</div>;

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 cursor-pointer">
        <ProfileIcon className="w-6 h-6" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-11 mt-2 w-[250px] bg-white shadow-lg rounded-xl border border-gray-200">
          <div className="px-4 pt-4 pb-3 border-b border-gray-200">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{user.email}</p>
          </div>
          <div className="px-4 py-3">
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-red-500 cursor-pointer"
            >
              <SignOutCrossIcon height={18} width={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}