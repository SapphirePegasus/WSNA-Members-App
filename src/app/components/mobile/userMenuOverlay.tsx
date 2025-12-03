"use client";

import { useState } from "react";
import { useUser } from "@/app/components/global/UserInfo";
import {
  CrossIcon,
  //MembershipCardIcon,
  ProfileIcon,
  SignOutCrossIcon,
} from "@/app/utils/icons";

export default function UserMenuMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useUser(); // get user from context

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="p-2">
        <ProfileIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-white z-50 p-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-[28px] font-extrabold">My WSNA</h2>
            <button onClick={() => setIsOpen(false)}>
              <CrossIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {/*<button className="flex items-center gap-2 text-xl font-semibold">
              <MembershipCardIcon className="w-6 h-6" />
              My Membership
            </button>*/}

            <div className="mt-10">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="font-semibold text-[16px]">
                {user ? user.email : "Please login"}
              </p>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 text-red-500 text-[16px] cursor-pointer"
            >
              <SignOutCrossIcon height={20} width={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
