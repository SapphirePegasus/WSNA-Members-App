"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/components/global/UserInfo";
import {
  CrossIcon,
  ProfileIcon,
  MembershipCardIcon,
  SignOutCrossIcon,
} from "@/app/utils/icons";

export default function UserMenuMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useUser();
  const router = useRouter();

  const handleMembership = () => {
    setIsOpen(false);
    router.push("/membership");
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="p-2">
        <ProfileIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bottom-16 bg-gray-50 z-50 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-foreground">My WSNA</h2>
            <button onClick={() => setIsOpen(false)} className="p-2">
              <CrossIcon className="w-5 h-5" />
            </button>
          </div>

          {/* My Membership row */}
          <button
            onClick={handleMembership}
            className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 bg-white w-full text-left"
          >
            <MembershipCardIcon className="w-6 h-6 shrink-0" />
            <span className="text-base font-semibold text-foreground">My membership</span>
          </button>

          {/* Signed in as */}
          <div className="px-4 py-4 border-b border-gray-200 bg-white">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {user ? user.email : "Please login"}
            </p>
          </div>

          {/* Sign out */}
          <div className="px-4 py-4 bg-white">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500 cursor-pointer"
            >
              <SignOutCrossIcon height={18} width={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}