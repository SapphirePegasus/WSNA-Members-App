"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useUser } from "@/app/components/global/UserInfo";
import {
  CrossIcon,
  ProfileIcon,
  MembershipCardIcon,
  SignOutCrossIcon,
} from "@/app/utils/icons";

interface UserMenuTriggerProps {
  onOpen: () => void;
}

export function UserMenuTrigger({ onOpen }: UserMenuTriggerProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="p-2"
      aria-haspopup="dialog"
      aria-label="Open account menu"
    >
      <ProfileIcon className="w-6 h-6" />
    </button>
  );
}

interface UserMenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserMenuPanel({ isOpen, onClose }: UserMenuPanelProps) {
  const { user, logout } = useUser();
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleMembership = () => {
    onClose();
    router.push("/membership");
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account menu"
      className="fixed inset-0 bg-[#FAFAFA] z-50 flex flex-col px-4 pt-safe"
    >
      {/* Header */}
      <div className="flex justify-between items-center py-3">
        <h2 className="text-2xl font-bold text-foreground">My WSNA</h2>
        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          className="p-2"
          aria-label="Close account menu"
        >
          <CrossIcon className="w-5 h-5" />
        </button>
      </div>

      <hr className="border-t border-gray-300 my-6" />

      {/* My Membership row */}
      <button
        type="button"
        onClick={handleMembership}
        className="flex items-center gap-4 w-full text-left"
      >
        <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#F4F4F5] shrink-0">
          <MembershipCardIcon className="w-6 h-[18.52px]" />
        </span>
        <span className="text-xl font-semibold text-foreground">My membership</span>
      </button>

      <hr className="border-t border-gray-300 my-6" />

      {/* Signed in as */}
      <div>
        <p className="text-xs font-medium text-gray-500">Signed in as</p>
        <p className="text-base font-medium text-foreground mt-1">
          {user ? user.email : "Please login"}
        </p>
      </div>

      <hr className="border-t border-gray-300 my-6" />

      {/* Sign out */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 text-base text-danger-red cursor-pointer w-fit"
      >
        <SignOutCrossIcon className="w-4 h-4" />
        Sign out
      </button>
    </div>,
    document.body
  );
}