"use client";

import { useState } from "react";
import { ProfileIcon, SignOutCrossIcon } from "@/app/utils/icons";

export default function UserMenuPC() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2">
        <ProfileIcon className="w-6 h-6" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-11 mt-2 w-[250px] bg-white shadow-lg rounded-xl border-b border-gray-300">
          <p className="text-xs text-gray-500 pt-4 pl-4 pr-4">Signed in as</p>
          <p className="font-semibold text-[16px] pl-4 pr-4">sue@example.com</p>
          <hr className="mt-5 border-t border-gray-300" />
          <button className="flex items-center gap-2 text-red-500 text-[16px] p-4 w-full cursor-pointer">
            <SignOutCrossIcon height={20} width={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
